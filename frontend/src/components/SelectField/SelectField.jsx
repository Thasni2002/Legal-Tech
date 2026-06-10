"use client";

export default function SelectField({
  label,
  options,
  name,
  ...props
}) {
  return (
    <div>
      <label className="block mb-2 font-medium text-gray-700">
        {label}
      </label>

      <select
        name={name}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-black focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none"
        {...props}
      >
        <option value="">Select {label}</option>

        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}