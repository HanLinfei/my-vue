export type vnodeTagType = keyof HTMLElementTagNameMap;
export type vnodePropsType = { [key: string]: string | (() => any) };

export interface IVnodeType {
  tag: vnodeTagType;
  props?: vnodePropsType;
  children?: IVnodeType[] | string;
  el?: HTMLElement;
}
