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
      <label className="block mb-2 font-medium text-gray-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black placeholder:text-black focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
        {...props}
      />
    </div>
  );
}