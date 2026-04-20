import React from 'react';

const DataPreloader = ({ className = "h-24 w-full" }) => {
    return (
        <div className={`relative overflow-hidden rounded-xl bg-white/5 ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
        </div>
    );
};

export default DataPreloader;
