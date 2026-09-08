"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

/**
 * Reusable SearchableDropdown component
 * 
 * @param {Array} options - Array of objects { id, label, sublabel, badge }
 * @param {string|number} value - Currently selected option id
 * @param {function} onChange - Callback function when an option is selected (returns value or full object)
 * @param {string} placeholder - Placeholder text for search field
 * @param {string} labelPrefix - Optional prefix (e.g. "Select Case:")
 * @param {React.ReactNode} icon - Optional icon element on the left
 * @param {string} className - Additional CSS classes for trigger button
 * @param {string} dropdownWidthClass - Width class for dropdown menu (default: "w-72 sm:w-80")
 */
export default function SearchableDropdown({
  options = [],
  value,
  onChange,
  placeholder = "Search...",
  labelPrefix,
  icon: IconComponent,
  className = "",
  dropdownWidthClass = "w-72 sm:w-80",
  alignRight = false,
  disabled = false,
  fullWidth = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Find active option object
  const selectedOption = options.find((opt) => String(opt.id) === String(value)) || options[0];

  // Filter options by search term
  const filteredOptions = options.filter((opt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase().trim();
    const labelMatch = (opt.label || "").toLowerCase().includes(term);
    const subMatch = (opt.sublabel || "").toLowerCase().includes(term);
    const badgeMatch = (opt.badge || "").toLowerCase().includes(term);
    const extraMatch = (opt.extra || "").toLowerCase().includes(term);
    return labelMatch || subMatch || badgeMatch || extraMatch;
  });

  // Handle click outside to auto-close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className={fullWidth ? "relative w-full text-left" : "relative inline-block text-left"} ref={dropdownRef}>
      <div className={fullWidth ? "flex items-center gap-2 w-full" : "flex items-center gap-2"}>
        {labelPrefix && (
          <span className="text-xs font-bold text-[#64748B] whitespace-nowrap">
            {labelPrefix}
          </span>
        )}

        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-2.5 rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#0F172A] shadow-2xs hover:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-all cursor-pointer ${
            fullWidth ? "w-full max-w-full" : "max-w-[260px] sm:max-w-[300px]"
          } ${
            isOpen ? "ring-2 ring-[#2563EB]/20 border-[#2563EB]" : ""
          } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            {IconComponent && (
              <span className="text-[#2563EB] shrink-0">
                {IconComponent}
              </span>
            )}
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown
            size={14}
            className={`text-[#64748B] shrink-0 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-[#2563EB]" : ""
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 ${dropdownWidthClass} ${
            alignRight ? "right-0" : "left-0"
          } rounded-2xl bg-white p-2 shadow-xl border border-[#E2E8F0] animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Search Bar Input */}
          <div className="relative mb-2">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
            />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-8 pr-7 py-1.5 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 outline-none transition-all font-medium"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] p-0.5 rounded-full"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.id) === String(value);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs transition-all flex items-start justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#2563EB] text-white font-bold"
                        : "hover:bg-blue-50/70 text-[#0F172A] hover:text-[#2563EB]"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate">{opt.label}</div>
                      {opt.sublabel && (
                        <div
                          className={`text-[11px] truncate mt-0.5 ${
                            isSelected ? "text-blue-100 font-normal" : "text-[#64748B]"
                          }`}
                        >
                          {opt.sublabel}
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <Check size={14} className="shrink-0 mt-0.5 text-white" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-center text-xs text-[#64748B]">
                No matching results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
