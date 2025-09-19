import React from 'react';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  id?: string;
}

const Section = React.forwardRef<HTMLDivElement, SectionProps>(({ title, children, id }, ref) => {
  return (
    <div ref={ref} id={id} className="mb-8 p-6 bg-white rounded-lg shadow-md border border-gray-200 scroll-mt-24">
      <h2 className="text-xl font-bold text-primary mb-4 pb-2 border-b-2 border-accent">
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {children}
      </div>
    </div>
  );
});

export default Section;
