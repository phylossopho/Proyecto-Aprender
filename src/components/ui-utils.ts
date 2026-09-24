export class ModalManager {
  private modals: Map<string, HTMLElement> = new Map();

  register(id: string, element: HTMLElement): void {
    this.modals.set(id, element);
  }

  get(id: string): HTMLElement | undefined {
    return this.modals.get(id);
  }

  show(id: string): void {
    const modal = this.modals.get(id);
    if (modal) modal.classList.remove('hidden');
  }

  hide(id: string): void {
    const modal = this.modals.get(id);
    if (modal) modal.classList.add('hidden');
  }

  hideAll(): void {
    this.modals.forEach(modal => modal.classList.add('hidden'));
  }

  isVisible(id: string): boolean {
    const modal = this.modals.get(id);
    return modal ? !modal.classList.contains('hidden') : false;
  }
}

export const modalManager = new ModalManager();

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string = '',
  innerHTML: string = ''
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (innerHTML) el.innerHTML = innerHTML;
  return el;
}

export function createButton(
  text: string,
  className: string,
  onClick: () => void,
  disabled: boolean = false
): HTMLButtonElement {
  const btn = createElement('button', className, text);
  btn.addEventListener('click', onClick);
  btn.disabled = disabled;
  return btn;
}

export function createSlider(
  id: string,
  min: number,
  max: number,
  value: number,
  step: number,
  onInput: (value: number) => void
): HTMLInputElement {
  const slider = createElement('input', 'slider') as HTMLInputElement;
  slider.type = 'range';
  slider.id = id;
  slider.min = String(min);
  slider.max = String(max);
  slider.value = String(value);
  slider.step = String(step);
  slider.addEventListener('input', () => onInput(Number(slider.value)));
  return slider;
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}