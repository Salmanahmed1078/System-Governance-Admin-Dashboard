export default function RedStickyNote({ text }) {
  return (
    <span className="inline-flex items-center rounded-md border border-red-300 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
      {text}
    </span>
  );
}
