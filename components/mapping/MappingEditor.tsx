import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { v4 as uuidv4 } from 'uuid';
import { FieldMetadata } from '../../types';
import Spinner from '../Spinner';
import PropertyInput from './PropertyInput';
import PropertyTextInput from './PropertyTextInput';
import { saveData, loadData } from '../../utils/localforage';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://aistudiocdn.com/pdfjs-dist@^4.6.1/build/pdf.worker.mjs';

interface MappingEditorProps {
  plan: string;
  onClose: () => void;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

type LoadingState = 'loading' | 'rendering' | 'idle' | 'error';
type ButtonState = 'idle' | 'loading' | 'success';

const ButtonContent: React.FC<{ state: ButtonState; idleText: string; loadingText: string; successText: string; }> = ({ state, idleText, loadingText, successText }) => {
    switch (state) {
        case 'loading':
            return (
                <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {loadingText}
                </>
            );
        case 'success':
            return (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {successText}
                </>
            );
        default:
            return <>{idleText}</>;
    }
};


const MappingEditor: React.FC<MappingEditorProps> = ({ plan, onClose, setToast }) => {
    const [mappingData, setMappingData] = useState<FieldMetadata[]>([]);
    const [history, setHistory] = useState<FieldMetadata[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [loadingState, setLoadingState] = useState<LoadingState>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
    const [zoom, setZoom] = useState(1);
    const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

    const isDraggingFields = useRef(false);
    const isDrawingSelectionBox = useRef(false);
    const dragStartState = useRef<{
        mouseX: number;
        mouseY: number;
        fields: Map<string, { initialX: number; initialY: number }>;
    } | null>(null);
    
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    const keyMoveHistoryTimeoutRef = useRef<number | null>(null);

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mappingStorageKey = `custom_mapping_${plan.toLowerCase()}`;

    const [saveState, setSaveState] = useState<ButtonState>('idle');
    const [resetState, setResetState] = useState<ButtonState>('idle');
    const [exportState, setExportState] = useState<ButtonState>('idle');

    // --- History Management ---
    const updateMapping = useCallback((updater: (prev: FieldMetadata[]) => FieldMetadata[], saveToHistory = true) => {
        setMappingData(prev => {
            const newMapping = updater(prev);
            if (saveToHistory) {
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(newMapping);
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
            }
            return newMapping;
        });
    }, [history, historyIndex]);

    const handleUndo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setMappingData(history[newIndex]);
        }
    }, [history, historyIndex]);

    const handleRedo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setMappingData(history[newIndex]);
        }
    }, [history, historyIndex]);


    const loadDefaultMapping = useCallback(async () => {
        const metadataUrl = `/assets/data/mappings/${plan.toLowerCase()}.json`;
        const metadataRes = await fetch(metadataUrl, { cache: 'no-store' });
        if (!metadataRes.ok) throw new Error(`Falha ao carregar mapeamento padrão: ${metadataRes.statusText}`);
        const defaultMapping = await metadataRes.json();
        if (defaultMapping.some((f: FieldMetadata) => !f.key)) {
            defaultMapping.forEach((f: FieldMetadata, i: number) => { 
                if (!f.key) f.key = f.fieldNumber + '-' + i;
            });
        }
        return defaultMapping;
    }, [plan]);

    // --- Data Loading and PDF Rendering ---
    useEffect(() => {
        let isCancelled = false;
        let loadedPdfDoc: pdfjsLib.PDFDocumentProxy | null = null;

        const loadDataAndPdf = async () => {
            try {
                setLoadingState('loading');
                setPdfDoc(null);
                
                const customMapping = await loadData<FieldMetadata[]>(mappingStorageKey);
                const initialMapping = (customMapping && customMapping.length > 0) ? customMapping : await loadDefaultMapping();
                
                if (customMapping && customMapping.length > 0) {
                     setToast({ message: 'Mapeamento personalizado carregado.', type: 'success' });
                }
    
                if (isCancelled) return;
                
                const templateUrl = `/assets/templates/${plan.toLowerCase()}.pdf`;
                const templateRes = await fetch(templateUrl);
                if (!templateRes.ok) throw new Error(`Falha ao carregar template PDF: ${templateRes.statusText}`);
                
                if (isCancelled) return;
                
                const templateBytes = await templateRes.arrayBuffer();
                if (isCancelled) return;
    
                const doc = await pdfjsLib.getDocument({ data: templateBytes }).promise;
                loadedPdfDoc = doc;
                
                if (isCancelled) { doc.destroy(); return; }
                
                setMappingData(initialMapping);
                setHistory([initialMapping]);
                setHistoryIndex(0);
                setPdfDoc(doc);
            } catch (err: any) {
                 if (!isCancelled) {
                     setErrorMessage(err.message);
                     setLoadingState('error');
                     setToast({ message: `Erro ao carregar editor: ${err.message}`, type: 'error' });
                 }
            }
        };
        
        loadDataAndPdf();

        return () => {
            isCancelled = true;
            if (loadedPdfDoc) {
                loadedPdfDoc.destroy();
            }
        };
    }, [plan, setToast, mappingStorageKey, loadDefaultMapping]);


    // Effect for rendering PDF with cleanup
    useEffect(() => {
        if (!pdfDoc) return;

        let renderTask: pdfjsLib.RenderTask | null = null;
        let isCancelled = false;

        const renderPdf = async () => {
            try {
                setLoadingState('rendering');
                const canvas = canvasRef.current;
                const context = canvas?.getContext('2d');
                if (!canvas || !context) {
                    throw new Error("Canvas ou contexto 2D não está disponível.");
                }

                const page = await pdfDoc.getPage(1);
                if (isCancelled) return;

                const viewport = page.getViewport({ scale: 1.0 });
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                setPageDimensions({ width: viewport.width, height: viewport.height });

                renderTask = page.render({ canvasContext: context, viewport: viewport } as any);
                await renderTask.promise;
                
                if (!isCancelled) {
                    setLoadingState('idle');
                }
            } catch (err: any) {
                if (err.name === 'RenderingCancelledException') {
                     return;
                }
                if (!isCancelled) {
                    setErrorMessage(err.message);
                    setLoadingState('error');
                    setToast({ message: `Erro ao renderizar PDF: ${err.message}`, type: 'error' });
                }
            }
        };
        renderPdf();

        return () => {
            isCancelled = true;
            renderTask?.cancel();
        };
    }, [pdfDoc, setToast]);
    
    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') { e.preventDefault(); handleUndo(); }
                if (e.key === 'y') { e.preventDefault(); handleRedo(); }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleUndo, handleRedo]);

    const handleContainerKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
        if (selectedKeys.size === 0) return;
        const step = e.shiftKey ? 10 : 1;
        let dx = 0, dy = 0;
        switch (e.key) {
            case 'ArrowUp': dy = -step; break;
            case 'ArrowDown': dy = step; break;
            case 'ArrowLeft': dx = -step; break;
            case 'ArrowRight': dx = step; break;
            default: return;
        }
        e.preventDefault();

        // Clear any pending history save timeout
        if (keyMoveHistoryTimeoutRef.current) {
            clearTimeout(keyMoveHistoryTimeoutRef.current);
        }

        updateMapping(prev => prev.map(f => selectedKeys.has(f.key) ? { ...f, x: f.x + dx, y: f.y + dy } : f), false);
        
        // Set a new timeout to save to history after movement stops
        keyMoveHistoryTimeoutRef.current = window.setTimeout(() => {
            updateMapping(prev => [...prev], true);
        }, 500); // Save after 500ms of inactivity

    }, [selectedKeys, updateMapping]);

    const handleMouseUpAfterMove = useCallback(() => {
        updateMapping(prev => [...prev], true); // Save the final state to history
    }, [updateMapping]);

    // --- Mouse Event Handlers ---
    const getCoords = (e: React.MouseEvent) => {
        const rect = contentRef.current!.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / zoom,
            y: (e.clientY - rect.top) / zoom,
        };
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const fieldKey = target.dataset.key;

        e.preventDefault();
        contentRef.current?.focus({ preventScroll: true }); // Ensure container has focus for keyboard events

        if (fieldKey) { // Clicked on a field -> Drag
            const { x, y } = getCoords(e);
            e.stopPropagation();
            isDraggingFields.current = true;
            
            const newSelectedKeys = new Set(selectedKeys);
            if (e.ctrlKey || e.metaKey) {
                newSelectedKeys.has(fieldKey) ? newSelectedKeys.delete(fieldKey) : newSelectedKeys.add(fieldKey);
            } else if (!newSelectedKeys.has(fieldKey)) {
                newSelectedKeys.clear();
                newSelectedKeys.add(fieldKey);
            }
            setSelectedKeys(newSelectedKeys);

            dragStartState.current = { mouseX: x, mouseY: y, fields: new Map() };
            mappingData.forEach(f => {
                if (newSelectedKeys.has(f.key)) {
                    dragStartState.current?.fields.set(f.key, { initialX: f.x, initialY: f.y });
                }
            });

        } else if (e.shiftKey) { // Shift key pressed -> Selection Box
            const { x, y } = getCoords(e);
            isDrawingSelectionBox.current = true;
            setSelectionBox({ x, y, width: 0, height: 0 });
        } else { // Clicked on background -> Pan
            isPanning.current = true;
            panStart.current = { x: e.pageX, y: e.pageY };
            if (contentRef.current) {
                contentRef.current.style.cursor = 'grabbing';
            }
            setSelectedKeys(new Set());
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (isPanning.current) {
            const container = scrollContainerRef.current;
            if (container) {
                const dx = e.pageX - panStart.current.x;
                const dy = e.pageY - panStart.current.y;
                container.scrollLeft -= dx;
                container.scrollTop -= dy;
                panStart.current = { x: e.pageX, y: e.pageY };
            }
            return;
        }
        
        if (!isDraggingFields.current && !isDrawingSelectionBox.current) return;
        
        const { x, y } = getCoords(e);

        if (isDraggingFields.current) {
            const capturedDragState = dragStartState.current;
            if (!capturedDragState) return;

            const dx = x - capturedDragState.mouseX;
            const dy = y - capturedDragState.mouseY;
            updateMapping(prev => prev.map(f => {
                const initialPos = capturedDragState.fields.get(f.key);
                return initialPos ? { ...f, x: Math.round(initialPos.initialX + dx), y: Math.round(initialPos.initialY + dy) } : f;
            }), false);

        } else if (isDrawingSelectionBox.current && selectionBox) {
            setSelectionBox({
                x: Math.min(x, selectionBox.x),
                y: Math.min(y, selectionBox.y),
                width: Math.abs(x - selectionBox.x),
                height: Math.abs(y - selectionBox.y)
            });
        }
    };

    const handleMouseUp = () => {
        if (isPanning.current) {
            isPanning.current = false;
            if (contentRef.current) {
                contentRef.current.style.cursor = 'grab';
            }
        }

        if (isDrawingSelectionBox.current && selectionBox) {
            const newSelectedKeys = new Set<string>();
            const sb = selectionBox;
            mappingData.forEach(f => {
                if (f.x < sb.x + sb.width && f.x + f.width > sb.x && f.y < sb.y + sb.height && f.y + f.height > sb.y) {
                    newSelectedKeys.add(f.key);
                }
            });
            setSelectedKeys(newSelectedKeys);
        }
        
        if(isDraggingFields.current) {
            handleMouseUpAfterMove();
        }

        isDraggingFields.current = false;
        isDrawingSelectionBox.current = false;
        dragStartState.current = null;
        setSelectionBox(null);
    };

    // --- UI Actions ---
    const handleSave = async () => {
        setSaveState('loading');
        try {
            await saveData(mappingStorageKey, mappingData);
            setToast({ message: 'Mapeamento salvo com sucesso!', type: 'success' });
            setSaveState('success');
            setTimeout(() => setSaveState('idle'), 2500);
        } catch (error) {
            console.error("Falha ao salvar o mapeamento:", error);
            setToast({ message: 'Erro ao salvar o mapeamento.', type: 'error' });
            setSaveState('idle');
        }
    };

    const handleReset = async () => {
        if (window.confirm('Você tem certeza que deseja resetar o mapeamento para o padrão? Todas as suas alterações salvas serão perdidas.')) {
            setResetState('loading');
            try {
                await saveData(mappingStorageKey, null);
                const defaultMapping = await loadDefaultMapping();
                setMappingData(defaultMapping);
                setHistory([defaultMapping]);
                setHistoryIndex(0);
                setToast({ message: 'Mapeamento resetado para o padrão.', type: 'success' });
                setResetState('success');
                setTimeout(() => setResetState('idle'), 2500);
            } catch (error) {
                console.error("Falha ao resetar o mapeamento:", error);
                setToast({ message: 'Erro ao resetar o mapeamento.', type: 'error' });
                setResetState('idle');
            }
        }
    };
    
    const handleExportJson = () => {
        const jsonString = JSON.stringify(mappingData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${plan.toLowerCase()}_mapeamento.json`;
        a.click();
        URL.revokeObjectURL(a.href);
        setToast({ message: 'JSON exportado!', type: 'success' });
        setExportState('success');
        setTimeout(() => setExportState('idle'), 2500);
    };

    const handleCreateField = () => {
        const newKey = uuidv4();
        const newField: FieldMetadata = {
            key: newKey,
            pageIndex: 0,
            x: 20,
            y: 20,
            width: 200,
            height: 20,
            label: 'Novo Campo',
            fieldNumber: 'novo_campo',
            multiline: false,
            fontSize: 9,
            align: 'left',
        };
        updateMapping(prev => [...prev, newField]);
        setSelectedKeys(new Set([newKey]));
        setToast({ message: 'Novo campo criado.', type: 'success' });
    };

    const handleDeleteSelectedFields = () => {
        if (selectedKeys.size === 0) return;
        if (window.confirm(`Tem certeza que deseja excluir ${selectedKeys.size} campo(s) selecionado(s)?`)) {
            updateMapping(prev => prev.filter(f => !selectedKeys.has(f.key)));
            setSelectedKeys(new Set());
            setToast({ message: 'Campo(s) excluído(s).', type: 'success' });
        }
    };

    const handleNumericPropertyChange = (prop: keyof FieldMetadata, value: number) => {
        if (selectedKeys.size !== 1) return;
        const key = selectedKeys.values().next().value;
        updateMapping(prev => prev.map(f => (f.key === key ? { ...f, [prop]: value } : f)));
    };
    
    const handleStringPropertyChange = (prop: keyof FieldMetadata, value: string) => {
        if (selectedKeys.size !== 1) return;
        const key = selectedKeys.values().next().value;
        updateMapping(prev => prev.map(f => (f.key === key ? { ...f, [prop]: value } : f)));
    };

    const handleBatchNumericPropertyChange = (prop: 'x' | 'y' | 'width' | 'height', value: number) => {
        updateMapping(prev => prev.map(f => selectedKeys.has(f.key) ? { ...f, [prop]: value } : f));
    };

    const selectedFields = mappingData.filter(f => selectedKeys.has(f.key));
    const singleSelectedField = selectedKeys.size === 1 ? selectedFields[0] : null;

    let commonX: number | '' = '';
    let commonY: number | '' = '';
    let commonWidth: number | '' = '';
    let commonHeight: number | '' = '';

    if (selectedKeys.size > 1) {
        const firstField = selectedFields[0];
        if (selectedFields.every(f => f.x === firstField.x)) {
            commonX = firstField.x;
        }
        if (selectedFields.every(f => f.y === firstField.y)) {
            commonY = firstField.y;
        }
        if (selectedFields.every(f => f.width === firstField.width)) {
            commonWidth = firstField.width;
        }
        if (selectedFields.every(f => f.height === firstField.height)) {
            commonHeight = firstField.height;
        }
    }


    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex flex-col" role="dialog" aria-modal="true">
            <header className="flex-shrink-0 bg-white p-2 shadow-lg flex justify-between items-center gap-4 text-sm">
                <div className="flex-grow">
                    <h2 className="text-lg font-bold text-primary">Editor: <span className="text-secondary">{plan}</span></h2>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Desfazer (Ctrl+Z)">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 15l-3-3m0 0l3-3m-3 3h8a5 5 0 015 5v1" /></svg>
                    </button>
                    <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed" title="Refazer (Ctrl+Y)">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 15l3-3m0 0l-3-3m3 3H5a5 5 0 00-5 5v1" /></svg>
                    </button>
                </div>
                <div className="flex items-center gap-2 border-l pl-2">
                    <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 rounded hover:bg-gray-200" title="Zoom Out"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></svg></button>
                    <span className="font-mono text-gray-700 w-12 text-center">{(zoom * 100).toFixed(0)}%</span>
                    <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-2 rounded hover:bg-gray-200" title="Zoom In"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg></button>
                </div>
                <div className="flex items-center gap-2 border-l pl-2">
                    <button
                        onClick={handleSave}
                        disabled={saveState !== 'idle'}
                        className={`px-3 py-2 w-32 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center
                            ${saveState === 'idle' ? 'bg-primary hover:bg-secondary' : ''}
                            ${saveState === 'loading' ? 'bg-blue-300 cursor-not-allowed' : ''}
                            ${saveState === 'success' ? 'bg-green-600' : ''}`}
                    >
                        <ButtonContent state={saveState} idleText="Salvar" loadingText="Salvando..." successText="Salvo!" />
                    </button>
                     <button
                        onClick={handleReset}
                        disabled={resetState !== 'idle'}
                        className={`px-3 py-2 w-32 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center
                            ${resetState === 'idle' ? 'bg-red-600 hover:bg-red-700' : ''}
                            ${resetState === 'loading' ? 'bg-red-300 cursor-not-allowed' : ''}
                            ${resetState === 'success' ? 'bg-green-600' : ''}`}
                    >
                        <ButtonContent state={resetState} idleText="Resetar" loadingText="Resetando..." successText="Resetado!" />
                    </button>
                    <button
                        onClick={handleExportJson}
                        disabled={exportState !== 'idle'}
                        className={`px-3 py-2 w-32 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center
                            ${exportState === 'idle' ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600'}`}
                    >
                        {exportState === 'success' ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Exportado!
                            </>
                        ) : 'Exportar'}
                    </button>
                    <button onClick={onClose} className="px-3 py-2 bg-gray-200 text-gray-800 font-bold rounded-lg hover:bg-gray-300">Fechar</button>
                </div>
            </header>
            <div className="flex-grow flex p-2 gap-2 overflow-hidden">
                <main ref={scrollContainerRef} className="flex-grow bg-gray-600 overflow-auto rounded p-4 flex justify-center items-start relative">
                    {loadingState === 'loading' && <div className="text-center text-white"><Spinner /> Carregando dados...</div>}
                    {loadingState === 'rendering' && <div className="text-center text-white"><Spinner /> Renderizando PDF...</div>}
                    {loadingState === 'error' && <div className="text-red-300 bg-red-900 p-4 rounded">{errorMessage}</div>}
                    <div
                        ref={contentRef}
                        onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} onKeyDown={handleContainerKeyDown} tabIndex={-1}
                        className="relative shadow-2xl origin-top-left outline-none"
                        style={{
                            width: pageDimensions ? `${pageDimensions.width}px` : '1px',
                            height: pageDimensions ? `${pageDimensions.height}px` : '1px',
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top left',
                            cursor: 'grab',
                            visibility: loadingState === 'idle' ? 'visible' : 'hidden',
                        }}
                    >
                        <canvas ref={canvasRef} className="absolute inset-0" />
                        {mappingData.map(field => (
                            <div
                                key={field.key} data-key={field.key}
                                style={{
                                    position: 'absolute', cursor: 'grab', userSelect: 'none',
                                    left: `${field.x}px`, top: `${field.y}px`,
                                    width: `${field.width}px`, height: `${field.height}px`,
                                    outline: selectedKeys.has(field.key) ? '2px solid #F2A900' : '1px dashed rgba(0, 90, 156, 0.7)',
                                    backgroundColor: selectedKeys.has(field.key) ? 'rgba(242, 169, 0, 0.3)' : 'rgba(0, 90, 156, 0.1)',
                                }}
                            >
                              <span data-key={field.key} className="text-xs text-primary font-mono p-1 overflow-hidden whitespace-nowrap">{field.label}</span>
                            </div>
                        ))}
                        {selectionBox && (
                            <div className="absolute border-2 border-dashed border-blue-500 bg-blue-500 bg-opacity-20"
                                 style={{ left: selectionBox.x, top: selectionBox.y, width: selectionBox.width, height: selectionBox.height }}/>
                        )}
                    </div>
                    <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-3">
                        <button
                            onClick={handleCreateField}
                            title="Criar novo campo"
                            className="w-12 h-12 bg-primary text-white rounded-full shadow-lg hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-600 focus:ring-secondary flex items-center justify-center"
                            aria-label="Criar novo campo"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                        <button
                            onClick={handleDeleteSelectedFields}
                            disabled={selectedKeys.size === 0}
                            title="Excluir campos selecionados"
                            className="w-12 h-12 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-600 focus:ring-red-700 flex items-center justify-center disabled:bg-gray-400 disabled:cursor-not-allowed"
                            aria-label="Excluir campos selecionados"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </main>
                <aside className="w-64 flex-shrink-0 bg-white rounded shadow-lg p-3 overflow-y-auto">
                    <h3 className="font-bold text-primary border-b pb-2 mb-2">Propriedades</h3>
                    {singleSelectedField ? (
                        <div className="space-y-2 text-sm">
                            <PropertyTextInput label="Chave (ID)" value={singleSelectedField.key} onChange={() => {}} readOnly tooltip="Identificador único do campo, gerado automaticamente."/>
                            <PropertyTextInput label="Rótulo" value={singleSelectedField.label} onChange={v => handleStringPropertyChange('label', v)} tooltip="Descrição do campo para fácil identificação no editor." />
                            <PropertyTextInput label="Nº Campo (TISS)" value={singleSelectedField.fieldNumber} onChange={v => handleStringPropertyChange('fieldNumber', v)} tooltip="O código TISS que conecta este campo aos dados do formulário (ex: '10nome')."/>
                            <hr className="my-3"/>
                            <PropertyInput label="X" value={singleSelectedField.x} onChange={v => handleNumericPropertyChange('x', v)} tooltip="Posição horizontal a partir da borda esquerda."/>
                            <PropertyInput label="Y" value={singleSelectedField.y} onChange={v => handleNumericPropertyChange('y', v)} tooltip="Posição vertical a partir da borda superior."/>
                            <PropertyInput label="Largura" value={singleSelectedField.width} onChange={v => handleNumericPropertyChange('width', v)} tooltip="Largura da caixa do campo."/>
                            <PropertyInput label="Altura" value={singleSelectedField.height} onChange={v => handleNumericPropertyChange('height', v)} tooltip="Altura da caixa do campo."/>
                            <PropertyInput label="Fonte" value={singleSelectedField.fontSize || 9} onChange={v => handleNumericPropertyChange('fontSize', v)} tooltip="Tamanho da fonte do texto."/>
                        </div>
                    ) : selectedKeys.size > 1 ? (
                         <div className="space-y-2 text-sm">
                            <p className="text-gray-700 font-bold">{selectedKeys.size} campos selecionados.</p>
                            <hr className="my-3"/>
                            <PropertyInput
                                label="X"
                                value={commonX}
                                onChange={v => handleBatchNumericPropertyChange('x', v)}
                                tooltip="Mudar a posição X de todos os campos selecionados."
                                placeholder={commonX === '' ? 'Múltiplo' : undefined}
                            />
                            <PropertyInput
                                label="Y"
                                value={commonY}
                                onChange={v => handleBatchNumericPropertyChange('y', v)}
                                tooltip="Mudar a posição Y de todos os campos selecionados."
                                placeholder={commonY === '' ? 'Múltiplo' : undefined}
                            />
                            <PropertyInput
                                label="Largura"
                                value={commonWidth}
                                onChange={v => handleBatchNumericPropertyChange('width', v)}
                                tooltip="Mudar a largura de todos os campos selecionados."
                                placeholder={commonWidth === '' ? 'Múltiplo' : undefined}
                            />
                            <PropertyInput
                                label="Altura"
                                value={commonHeight}
                                onChange={v => handleBatchNumericPropertyChange('height', v)}
                                tooltip="Mudar a altura de todos os campos selecionados."
                                placeholder={commonHeight === '' ? 'Múltiplo' : undefined}
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">Selecione um campo para ver suas propriedades.</p>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default MappingEditor;