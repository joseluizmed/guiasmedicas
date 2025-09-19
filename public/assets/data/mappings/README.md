# Pasta de Mapeamentos JSON por Plano

Este diretório contém os arquivos de mapeamento JSON que definem as coordenadas exatas para cada campo de dados nos templates PDF.

## Regras de Nomenclatura

- **Um arquivo por plano:** Cada plano de saúde deve ter seu próprio arquivo JSON de mapeamento.
- **Nome do arquivo:** O nome do arquivo deve corresponder exatamente ao `value` do plano de saúde (definido em `utils/constants.ts`), convertido para letras minúsculas. A extensão deve ser `.json`.

**Exemplos:**
- Para o plano "Unimed" (`value: 'Unimed'`), o arquivo deve ser `unimed.json`.
- Para o plano "Bradesco Saúde" (`value: 'Bradesco'`), o arquivo deve ser `bradesco.json`.
- Para o plano "Saúde Caixa" (`value: 'saudecaixa'`), o arquivo deve ser `saudecaixa.json`.

## Estrutura do Arquivo JSON

O arquivo JSON deve conter um array de objetos. Cada objeto representa um campo no PDF e deve ter a seguinte estrutura:

```json
[
  {
    "key": "identificador_unico_do_campo",
    "pageIndex": 0,
    "x": 15,
    "y": 163,
    "label": "Descrição do campo para depuração",
    "width": 475,
    "height": 20,
    "fieldNumber": "10nome",
    "multiline": false,
    "fontSize": 9,
    "align": "left"
  }
]
```

- `key`: Um identificador único em string para o campo (pode ser o mesmo que `fieldNumber` ou algo mais descritivo).
- `pageIndex`: O número da página no PDF onde o campo está localizado (começando em `0` para a primeira página).
- `x`, `y`: As coordenadas do canto superior esquerdo da caixa do campo, em pontos (points). A origem (0,0) é o canto inferior esquerdo da página.
- `width`, `height`: A largura e altura da caixa do campo, em pontos.
- `label`: Uma descrição do campo, usada principalmente para facilitar a identificação.
- `fieldNumber`: **A chave mais importante.** Este é o identificador que conecta o campo no PDF aos dados do formulário da aplicação. A lista completa de `fieldNumber` disponíveis pode ser encontrada no arquivo `utils/tissMapper.ts`.
- `multiline` (opcional): `true` se o campo deve permitir quebra de linha automática. Padrão é `false`.
- `fontSize` (opcional): O tamanho da fonte. O padrão é `9`.
- `align` (opcional): O alinhamento do texto ('left', 'center', 'right'). O padrão é `left`.

Use sua ferramenta de mapeamento para obter as coordenadas `x`, `y`, `width` e `height` precisas para cada campo em cada template de PDF.
