const form = document.querySelector('.signup-form');
const message = document.querySelector('.form-message');
const songList = document.querySelector('#song-list');
const shuffleButton = document.querySelector('#shuffle-button');
const songs = [
  ['Living Hope', 'living-hope.png', 'living-hope.mp3'],
  ['More Than Zero', 'more-than-zero.png', 'more-than-zero.mp3'],
  ['Cinderella in the Rain', 'cinderella-in-the-rain.png', 'cinderella-in-the-rain.mp3'],
  ['Winner, Winner, Chicken Dinner', 'winner-winner-chicken-dinner.png', 'winner-winner-chicken-dinner.mp3', 'winner-winner-chicken-dinner.md'],
  ['To Good Health!', 'to-good-health.png', 'to-good-health.mp3'],
  ['Truth Ain’t What It Used to Be', 'truth-aint-what-it-used-to-be.png', 'truth-aint-what-it-used-to-be.mp3'],
];
const asset = (folder, file) => `https://raw.githubusercontent.com/roleyboard/damian-music/main/public/${folder}/${file}`;

function renderSongs() {
  songList.innerHTML = songs.map((song, index) => `
    <article class="song-card">
      <button class="song-select" type="button" data-song="${index}">
        <span class="queue-position">${index + 1}</span>
        <img class="song-cover" src="${asset('covers', song[1])}" alt="">
        <span class="song-copy"><span class="song-title">${song[0]}</span><span class="song-subtitle">${song[3] ? 'Audio + lyrics' : 'Original track'}</span></span>
      </button>
      <audio class="song-audio" controls preload="metadata" src="${asset('audio', song[2])}"></audio>
    </article>
  `).join('');
}

renderSongs();

songList.addEventListener('click', (event) => {
  const button = event.target.closest('.song-select');
  if (!button) return;
  document.querySelectorAll('.song-card').forEach((card) => card.classList.remove('is-playing'));
  button.closest('.song-card').classList.add('is-playing');
});

shuffleButton.addEventListener('click', () => {
  songs.sort(() => Math.random() - 0.5);
  renderSongs();
});

document.querySelectorAll('[data-chord]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-chord]').forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
    document.querySelector('#chord-display').textContent = button.dataset.chord;
    document.querySelector('#chord-tip').textContent = `${button.dataset.chord} is ready to play.`;
  });
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const email = new FormData(form).get('email');
  message.textContent = `Thanks. We'll write to ${email}.`;
  form.reset();
});
