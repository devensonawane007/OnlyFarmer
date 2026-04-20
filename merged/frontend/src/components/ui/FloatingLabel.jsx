import React from 'react';

const FloatingLabel = ({ label, id, children, value }) => {
    return (
        <div className="relative group w-full">
            {children}
            <label
                htmlFor={id}
                className={`absolute left-3 transition-all duration-200 pointer-events-none text-white/50
          ${value
                        ? "-top-2.5 scale-75 bg-[#0f0500] px-1 text-farm-green-400"
                        : "top-3 group-focus-within:-top-2.5 group-focus-within:scale-75 group-focus-within:bg-[#0f0500] group-focus-within:px-1 group-focus-within:text-farm-green-400"
                    }
        `}
            >
                {label}
            </label>
        </div>
    );
};

export default FloatingLabel;
