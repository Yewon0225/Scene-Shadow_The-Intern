export interface Sentence {
  id: number;
  speaker: string;
  text: string;
  korean: string;
  stress: string[];
  start: number;
  end: number;
}

export type SelfCheckRating = 'good' | 'ok' | 'needs_work' | null;

export interface SentenceProgress {
  id: number;
  plays: number;
  recordings: number;
  selfCheck: [SelfCheckRating, SelfCheckRating, SelfCheckRating];
  status: 'new' | 'practiced' | 'done';
}

export type ShadowStep = 1 | 2 | 3 | 4;

export interface MovieMetadata {
  titleEn: string;
  titleKo: string;
  year: number;
  director: string;
  screenplay: string;
  production: string;
  distribution: string;
  sceneDescription: string;
  youtubeTitle: string;
  youtubeChannel: string;
  youtubeUrl: string;
  videoId: string;
  practiceStart: number;
  practiceEnd: number;
  author: string;
}

export const MOVIE_DATA: MovieMetadata = {
  titleEn: 'The Intern',
  titleKo: '인턴',
  year: 2015,
  director: 'Nancy Meyers',
  screenplay: 'Nancy Meyers',
  production: 'Waverly Films',
  distribution: 'Warner Bros. Pictures',
  sceneDescription: 'Jules helps Ben set up his Facebook profile at the office over late-night pizza.',
  youtubeTitle: 'The Intern Movie CLIP - Better Late Than Never (2015) - Robert De Niro, Anne Hathaway Movie HD',
  youtubeChannel: 'Rotten Tomatoes Coming Soon',
  youtubeUrl: 'https://youtu.be/1uRBxyPqkh0?si=kh8LWo232QLWa5Dp',
  videoId: '1uRBxyPqkh0',
  practiceStart: 1.0,
  practiceEnd: 42.0,
  author: '성예원',
};

export const DEFAULT_SENTENCES: Sentence[] = [
  {
    id: 1,
    speaker: 'Jules',
    text: "So, you're on Facebook, huh?",
    korean: "어머, 페이스북 하시는군요, 그렇죠?",
    stress: ['Facebook', 'huh'],
    start: 1.0,
    end: 3.2,
  },
  {
    id: 2,
    speaker: 'Ben',
    text: "Well, I've been trying to figure it out. I joined about 10 minutes ago.",
    korean: "어떻게 쓰는지 파악해보려던 참이에요. 한 10분 전에 가입했거든요.",
    stress: ['trying', 'figure', 'joined', '10 minutes', 'ago'],
    start: 3.5,
    end: 6.3,
  },
  {
    id: 3,
    speaker: 'Jules',
    text: "Well, better late than never.",
    korean: "뭐, 안 하는 것보단 늦게라도 시작하는 게 낫죠.",
    stress: ['better', 'late', 'never'],
    start: 7.0,
    end: 9.0,
  },
  {
    id: 4,
    speaker: 'Jules',
    text: "You want some help?",
    korean: "좀 도와드릴까요?",
    stress: ['want', 'help'],
    start: 9.0,
    end: 10.0,
  },
  {
    id: 5,
    speaker: 'Ben',
    text: "I' I'd love some, but really, you've got better things to do.",
    korean: "도와주시면 감사하죠, 하지만 더 중요한 일들이 많으실 텐데요.",
    stress: ['love', 'really', 'better', 'things', 'do'],
    start: 10.5,
    end: 13.0,
  },
  {
    id: 6,
    speaker: 'Jules',
    text: "No, I need a diversion.",
    korean: "아니에요, 마침 기분 전환할 거리가 필요했어요.",
    stress: ['No', 'need', 'diversion'],
    start: 13.2,
    end: 14.8,
  },
  {
    id: 7,
    speaker: 'Jules',
    text: "Do you have a photo of yourself?",
    korean: "본인 사진 있으세요?",
    stress: ['photo', 'yourself'],
    start: 17.0,
    end: 18.5,
  },
  {
    id: 8,
    speaker: 'Jules',
    text: "Okay, I just need to send that to you.",
    korean: "좋아요, 방금 찍은 사진을 보내드릴게요.",
    stress: ['Okay', 'need', 'send', 'you'],
    start: 27.0,
    end: 30.3,
  },
];
