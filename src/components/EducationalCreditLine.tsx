import React from 'react';
import { MOVIE_DATA } from '../types';

interface Props {
  className?: string;
}

export const EducationalCreditLine: React.FC<Props> = ({ className = '' }) => {
  return (
    <p
      className={`text-xs sm:text-[13px] text-neutral-500 text-center leading-relaxed tracking-tight py-1.5 px-3 select-none ${className}`}
    >
      Clip: <span className="font-medium italic">{MOVIE_DATA.titleEn}</span> ({MOVIE_DATA.year}),{' '}
      {MOVIE_DATA.distribution} / {MOVIE_DATA.production} · via YouTube · For educational use only
    </p>
  );
};
