// 共享主题色状态：画廊提取图片主色后写入这里，three.js 背景订阅它来联动换色。
import { writable } from 'svelte/store';

export const DEFAULT_ACCENT = '#e6b458';

// 当前主题色（hex）。默认暖金，浏览图片时被图片主色覆盖。
export const accent = writable(DEFAULT_ACCENT);
