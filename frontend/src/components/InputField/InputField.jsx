"use client";

export default function InputField({
  label,
  type = "text",
  placeholder,
  name,
  ...props
}) {
  return (
    <div>
      <label className="block mb-2 text-sm font-medium text-[#0F172A]">
        {label}
      </label>

      <input
        type={type}
        name={name}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] outline-none transition-all duration-200"
        {...props}
      />
    </div>
  );
}