export interface Song {
  id: number;
  title: string;
  cover: string;
  audio: string;
  year?: number;
  lyrics?: string;
}

export const songs: Song[] = [
  {
    id: 1,
    title: "Living Hope",
    cover: "/covers/living-hope.png",
    audio: "/audio/living-hope.mp3",
  },

  {
    id: 2,
    title: "More Than Zero",
    cover: "/covers/more-than-zero.png",
    audio: "/audio/more-than-zero.mp3",
  },

  {
    id: 3,
    title: "Cinderella in the Rain",
    cover: "/covers/cinderella-in-the-rain.png",
    audio: "/audio/cinderella-in-the-rain.mp3",
  },

  {
    id: 4,
    title: "Winner, Winner, Chicken Dinner",
    cover: "/covers/winner-winner-chicken-dinner.png",
    audio: "/audio/winner-winner-chicken-dinner.mp3",
    lyrics: "/lyrics/winner-winner-chicken-dinner.md",
  },

  {
    id: 5,
    title: "To Good Health!",
    cover: "/covers/to-good-health.png",
    audio: "/audio/to-good-health.mp3",
  },

  {
    id: 6,
    title: "Truth Ain’t What It Used to Be",
    cover: "/covers/truth-aint-what-it-used-to-be.png",
    audio: "/audio/truth-aint-what-it-used-to-be.mp3",
  },
];
