import React,{useEffect,useRef} from 'react';
import {createPortal} from 'react-dom';
import ReviewForm from './ReviewForm';
export default function ReviewModal(props){const ref=useRef(null);const closeRef=useRef(props.onClose);closeRef.current=props.onClose;
 useEffect(()=>{const previous=document.activeElement,overflow=document.body.style.overflow;document.body.style.overflow='hidden';ref.current?.querySelector('button')?.focus();const key=e=>{if(e.key==='Escape'){e.preventDefault();closeRef.current();}if(e.key==='Tab'){const nodes=[...ref.current.querySelectorAll('button:not(:disabled),textarea:not(:disabled),input:not(:disabled)')];const first=nodes[0],last=nodes.at(-1);if(e.shiftKey && document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first?.focus();}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);previous?.focus();};},[]);
 return createPortal(<div className="fixed inset-0 z-[1000] bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"><section ref={ref} role="dialog" aria-modal="true" aria-labelledby="review-dialog-title" className="w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-3xl bg-white shadow-2xl"><ReviewForm {...props}/></section></div>,document.body);
}
