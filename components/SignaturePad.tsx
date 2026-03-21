"use client";
import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/Button';

export function SignaturePad({ onSave, initialDataUrl }: { onSave: (url: string) => void, initialDataUrl?: string }) {
  const sigPad = useRef<any>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  // Initialize
  useEffect(() => {
    if (initialDataUrl && sigPad.current) {
      sigPad.current.fromDataURL(initialDataUrl);
      setIsEmpty(false);
    }
  }, [initialDataUrl]);

  const clear = () => {
    sigPad.current?.clear();
    setIsEmpty(true);
    onSave("");
  };

  const save = () => {
    if (sigPad.current?.isEmpty()) {
      setIsEmpty(true);
      onSave("");
    } else {
      const url = sigPad.current?.getTrimmedCanvas().toDataURL('image/png');
      setIsEmpty(false);
      onSave(url);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="border-2 border-dashed border-gray-300 rounded-md bg-white overflow-hidden" style={{ height: 200 }}>
        <SignatureCanvas 
          ref={sigPad}
          penColor="black"
          canvasProps={{ className: "w-full h-full cursor-crosshair" }}
          onEnd={save}
        />
      </div>
      <div className="flex justify-between items-center px-1">
        <span className={`text-sm ${isEmpty ? 'text-gray-500' : 'text-green-600 font-medium flex items-center gap-1'}`}>
          {isEmpty ? 'Signez dans le cadre ci-dessus' : '✓ Signature capturée'}
        </span>
        <button className="text-sm text-red-600 hover:text-red-700 font-medium px-3 py-1" onClick={clear} type="button">
          Effacer
        </button>
      </div>
    </div>
  );
}
