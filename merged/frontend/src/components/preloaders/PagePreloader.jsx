import React from 'react';

const PagePreloader = () => {
    return (
        <div className="flex items-center justify-center w-full h-[400px]">
            <div className="relative w-12 h-12">
                <div className="absolute inset-0 rounded-full border-2 border-farm-green-400/20" />
                <div className="absolute inset-0 rounded-full border-t-2 border-farm-green-400 animate-spin" />
                <div className="absolute inset-2 rounded-full border-r-2 border-farm-teal-400 animate-[spin_1.5s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border-l-2 border-farm-amber-400 animate-[spin_2s_linear_infinite]" />
            </div>
        </div>
    );
};

export default PagePreloader;
