'use client'

import { useState } from 'react'
import Image from 'next/image'

type Props = {
  src: string
}

export default function PhotoViewer({ src }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className="relative w-full rounded-xl mb-2 overflow-hidden cursor-pointer"
        style={{ maxHeight: '288px' }}
        onClick={() => setOpen(true)}
      >
        <Image
          src={src}
          alt="証拠写真"
          width={500}
          height={500}
          className="w-full object-cover"
          loading="lazy"
          sizes="(max-width: 512px) 100vw, 512px"
        />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light z-10"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
          <Image
            src={src}
            alt="証拠写真"
            width={1200}
            height={1200}
            className="max-w-[95vw] max-h-[90vh] object-contain"
            sizes="95vw"
            quality={95}
          />
        </div>
      )}
    </>
  )
}
