'use client';

type Props = {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
};

export function DynamicList({
  items,
  onChange,
  placeholder,
  addLabel = '+ Adicionar item',
}: Props) {
  const list = items.length === 0 ? [''] : items;

  function update(i: number, v: string) {
    const next = [...list];
    next[i] = v;
    onChange(next);
  }

  function add() {
    onChange([...list, '']);
  }

  function remove(i: number) {
    if (list.length === 1) {
      onChange(['']);
      return;
    }
    onChange(list.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-2">
      {list.map((value, i) => (
        <div key={i} className="flex gap-2 items-start">
          <input
            type="text"
            value={value}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-2.5 py-1.5 border border-bdr rounded-lg text-[12px] bg-bg focus:outline-none focus:border-pril focus:ring-2 focus:ring-pril/15"
          />
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label="Remover"
            className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-600 text-base flex items-center justify-center flex-shrink-0"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full px-3 py-1.5 bg-violet-50 border border-dashed border-violet-400 rounded-lg text-violet-700 text-[11px] font-semibold hover:bg-violet-100"
      >
        {addLabel}
      </button>
    </div>
  );
}
