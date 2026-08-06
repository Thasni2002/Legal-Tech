"use client";

const EMOJI_CATEGORIES = [
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😊", "🙂", "😉", "😍", "👍", "👎", "👏", "🙌", "🤝", "🙏", "⚖️", "📜", "📋", "📁", "💼", "🏢"]
  },
  {
    name: "Legal & Work",
    emojis: ["⚖️", "📜", "📁", "📂", "📌", "🖊️", "📝", "✅", "❌", "⚠️", "⏳", "📅", "🔒", "🔑", "💼", "📞", "✉️", "🎯", "💡", "🔍"]
  },
  {
    name: "Reactions",
    emojis: ["❤️", "🎉", "🔥", "✨", "💯", "🚀", "💡", "⭐", "✔️", "❓", "❗", "👌", "🤝", "💪", "😎", "🤔", "😮", "😴", "🙋", "👋"]
  }
];

export default function EmojiPicker({ onSelectEmoji, onClose }) {
  return (
    <div className="absolute bottom-14 right-4 z-50 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex justify-between items-center pb-2 mb-2 border-b border-slate-100">
        <span className="text-xs font-bold text-slate-700">Quick Emojis</span>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-slate-100"
        >
          ✕
        </button>
      </div>

      <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
        {EMOJI_CATEGORIES.map((cat) => (
          <div key={cat.name}>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              {cat.name}
            </span>
            <div className="grid grid-cols-5 gap-1">
              {cat.emojis.map((emoji, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectEmoji(emoji);
                  }}
                  className="w-9 h-9 text-lg flex items-center justify-center rounded-lg hover:bg-slate-100 hover:scale-115 transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
