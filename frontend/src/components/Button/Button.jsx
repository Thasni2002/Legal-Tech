"use client";

export default function Button({
  title,
  type = "button",
  variant = "primary",
  onClick,
  ...props
}) {
  const styles = {
    primary:
      "bg-blue-600 hover:bg-blue-700 text-white",

    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-700",

    danger:
      "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`
        px-6
        py-3
        rounded-xl
        font-medium
        transition
        ${styles[variant]}
      `}
      {...props}
    >
      {title}
    </button>
  );
}