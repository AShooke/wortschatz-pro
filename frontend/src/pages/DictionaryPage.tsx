import { useState, type FormEvent } from 'react';
import { Plus, Search, Volume2, X } from 'lucide-react';

import { api, type Word, type WordCreate } from '../api/client';
import { ArticleBadge } from '../components/ArticleBadge';
import { WordDetailsModal } from '../components/WordDetailsModal';
import { isDue } from '../lib/scheduling';
import { useLearnerData } from '../lib/useLearnerData';
import { speakGerman } from '../utils/speech';

const ALL_FILTER = 'Все';

const emptyForm: WordCreate = {
  german: '',
  article: null,
  plural: '',
  russian: '',
  part_of_speech: 'noun',
  example: '',
  category: 'Мои слова',
};

export function DictionaryPage() {
  const { words: allWords, isLoading } = useLearnerData();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(ALL_FILTER);
  const [isModalOpen, setModalOpen] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [form, setForm] = useState<WordCreate>(emptyForm);

  const filters = [
    ALL_FILTER,
    ...new Set(allWords.flatMap((word) => [
      ...(word.category ? [word.category] : []),
      ...(word.tags ?? []),
    ])),
  ].slice(1).sort((left, right) => left.localeCompare(right));
  const filterOptions = [ALL_FILTER, ...filters];
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const words = allWords.filter((word) => {
    const matchesSearch = !normalizedSearch
      || word.german.toLocaleLowerCase().includes(normalizedSearch)
      || word.russian.toLocaleLowerCase().includes(normalizedSearch);
    const matchesTopic = filter === ALL_FILTER || word.category === filter || word.tags?.includes(filter);
    return matchesSearch && matchesTopic;
  });

  const updateForm = (field: keyof WordCreate, value: string | null) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const addWord = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.german.trim() || !form.russian.trim()) return;
    await api.createWord({
      ...form,
      german: form.german.trim(),
      russian: form.russian.trim(),
      plural: form.plural?.trim() || null,
      example: form.example?.trim() || null,
    });
    setForm(emptyForm);
    setModalOpen(false);
  };

  const displayedWord = selectedWord ? allWords.find((word) => word.id === selectedWord.id) ?? selectedWord : null;

  return (
    <section className="space-y-5" aria-labelledby="dictionary-heading">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-sky-300">Ваши слова</p>
          <h1 id="dictionary-heading" className="mt-1 text-3xl font-semibold tracking-tight text-white">Словарь</h1>
        </div>
        <button type="button" aria-label="Добавить слово" onClick={() => setModalOpen(true)} className="flex min-h-touch items-center gap-2 rounded-touch bg-accent px-3 text-sm font-bold text-ink transition hover:bg-accent/90"><Plus size={17} /> Добавить</button>
      </div>
      <label className="flex min-h-touch items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 px-4 text-slate-400 shadow-xl backdrop-blur-md focus-within:border-accent/70">
        <Search size={18} />
        <span className="sr-only">Поиск по словарю</span>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти по-немецки или по-русски" className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500" />
      </label>
      <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filterOptions.map((option) => <button key={option} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)} className={`min-h-touch shrink-0 rounded-full border px-4 text-xs font-semibold transition ${filter === option ? 'border-accent bg-accent text-ink' : 'border-slate-700/60 bg-slate-800/40 text-slate-400 hover:border-slate-500 hover:text-white'}`}>{option}</button>)}
      </div>
      <div className="space-y-2">
        {isLoading ? <p className="py-8 text-center text-sm text-slate-500">Загружаем словарь...</p> : words.length ? words.map((word) => <WordRow key={word.id} word={word} onSelect={setSelectedWord} />) : <p className="rounded-touch border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">Слов пока нет. Добавьте первое слово.</p>}
      </div>
      {isModalOpen && <AddWordModal form={form} onChange={updateForm} onClose={() => setModalOpen(false)} onSubmit={addWord} />}
      {displayedWord && <WordDetailsModal word={displayedWord} onClose={() => setSelectedWord(null)} />}
    </section>
  );
}

function WordRow({ word, onSelect }: { word: Word; onSelect: (word: Word) => void }) {
  return (
    <article className="flex items-center gap-3 rounded-2xl border border-slate-700/50 bg-slate-800/40 p-3 shadow-xl backdrop-blur-md">
      <button type="button" aria-label={`Произнести ${word.german}`} onClick={(event) => { event.stopPropagation(); speakGerman(word.german); }} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-400/10 text-sky-300 transition hover:bg-sky-400 hover:text-slate-950"><Volume2 size={18} /></button>
      <button type="button" onClick={() => onSelect(word)} className="min-w-0 flex-1 py-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300">
        <div className="flex flex-wrap items-center gap-2">
          {word.article && <ArticleBadge article={word.article} className="px-2 py-0.5 text-[10px]" />}
          <h2 className="truncate font-semibold text-white">{word.german}</h2>
        </div>
        <p className="mt-1 truncate text-sm text-slate-400">{word.russian}</p>
      </button>
      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${isDue(word.srs?.dueAt ?? word.next_review_at) ? 'bg-amber-300/10 text-amber-100' : 'bg-slate-700/70 text-slate-300'}`}>
        {isDue(word.srs?.dueAt ?? word.next_review_at) ? 'к повторению' : 'запланировано'}
      </span>
    </article>
  );
}

function AddWordModal({ form, onChange, onClose, onSubmit }: { form: WordCreate; onChange: (field: keyof WordCreate, value: string | null) => void; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-slate-950/80 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="add-word-heading">
      <form onSubmit={onSubmit} className="max-h-[92svh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <div><p className="text-sm font-semibold text-sky-300">Новая карточка</p><h2 id="add-word-heading" className="mt-1 text-2xl font-semibold text-white">Добавить слово</h2></div>
          <button type="button" aria-label="Закрыть" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white"><X size={20} /></button>
        </div>
        <div className="mt-6 space-y-4">
          <Field label="Немецкое слово" value={form.german} onChange={(value) => onChange('german', value)} placeholder="z. B. der Termin" required />
          <div className="grid grid-cols-2 gap-3"><Field label="Артикль" value={form.article ?? ''} onChange={(value) => onChange('article', value || null)} placeholder="der / die / das" /><Field label="Множественное число" value={form.plural ?? ''} onChange={(value) => onChange('plural', value)} placeholder="die Termine" /></div>
          <Field label="Перевод на русский" value={form.russian} onChange={(value) => onChange('russian', value)} placeholder="встреча, запись" required />
          <label className="block text-sm font-semibold text-slate-300">Часть речи<select value={form.part_of_speech} onChange={(event) => onChange('part_of_speech', event.target.value)} className="mt-2 min-h-touch w-full rounded-touch border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-sky-300"><option value="noun">Существительное</option><option value="verb">Глагол</option><option value="adjective">Прилагательное</option><option value="adverb">Наречие</option><option value="other">Другое</option></select></label>
          <label className="block text-sm font-semibold text-slate-300">Пример предложения<textarea value={form.example ?? ''} onChange={(event) => onChange('example', event.target.value)} placeholder="Ich habe morgen einen Termin." rows={3} className="mt-2 w-full resize-none rounded-touch border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-300" /></label>
        </div>
        <button type="submit" className="mt-6 min-h-touch w-full rounded-touch bg-accent px-4 text-sm font-bold text-ink transition hover:bg-accent/90">Сохранить слово</button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; required?: boolean }) {
  return <label className="block text-sm font-semibold text-slate-300">{label}<input required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="mt-2 min-h-touch w-full rounded-touch border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-sky-300" /></label>;
}

