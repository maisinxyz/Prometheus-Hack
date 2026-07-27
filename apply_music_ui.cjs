const fs = require('fs');
let content = fs.readFileSync('src/scenes/LevelSelectScene.ts', 'utf8');
content = content.replace(/\r\n/g, '\n');

// Replace 1: Top init
const topTarget = `    const currentTrackKey = playlist[trackIndex].key;
    const existingMusic = this.sound.get(currentTrackKey);
    const initVolume = parseFloat(localStorage.getItem('musicVolume') ?? '0.5');

    // Stop any other currently playing tracks if we came from another scene
    playlist.forEach(track => {
      if (track.key !== currentTrackKey) {
        this.sound.stopByKey(track.key);
      }
    });

    let music = this.sound.get(currentTrackKey);
    if (!music) {
      music = this.sound.add(currentTrackKey, { loop: true, volume: initVolume });
    }
    
    if (music.isPaused) {
      music.resume();
    } else if (!music.isPlaying) {
      const savedSeek = localStorage.getItem('musicSeek');
      if (savedSeek) {
        music.play({ seek: parseFloat(savedSeek), volume: initVolume });
      } else {
        music.play({ volume: initVolume });
      }
    }

    // Save seek position periodically so music resumes from the same spot
    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (music && music.isPlaying) {
          const seek = (music as Phaser.Sound.WebAudioSound).seek;
          localStorage.setItem('musicSeek', seek.toString());
        }
      }
    });

    // Explicitly enforce volume on the WebAudioSound instance just in case
    (music as Phaser.Sound.WebAudioSound).setVolume(initVolume);
    
    // Always enforce the saved volume, especially when returning to the scene
    (music as Phaser.Sound.WebAudioSound).setVolume(initVolume);`;

const topReplace = `    const currentTrackKey = playlist[trackIndex].key;
    const initVolume = parseFloat(localStorage.getItem('musicVolume') ?? '0.5');

    // Stop any other currently playing tracks if we came from another scene
    playlist.forEach(track => {
      if (track.key !== currentTrackKey) {
        this.sound.stopByKey(track.key);
      }
    });

    let music = this.sound.get(currentTrackKey) as Phaser.Sound.WebAudioSound;
    if (!music) {
      music = this.sound.add(currentTrackKey) as Phaser.Sound.WebAudioSound;
    }
    
    // Clean up old listeners just in case
    music.removeAllListeners('complete');
    music.on('complete', () => {
      const rep = localStorage.getItem('musicRepeat') === 'true';
      if (!rep) {
        (this as any).changeTrackRef?.(1);
      } else {
        music.play({ volume: parseFloat(localStorage.getItem('musicVolume') ?? '0.5') });
      }
    });

    if (music.isPaused) {
      music.resume();
    } else if (!music.isPlaying) {
      const savedSeek = localStorage.getItem('musicSeek');
      if (savedSeek) {
        music.play({ seek: parseFloat(savedSeek), volume: initVolume });
      } else {
        music.play({ volume: initVolume });
      }
    }

    // Save seek position periodically so music resumes from the same spot
    this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => {
        // Redefine music in case it changed via changeTrack
        const curKey = playlist[(this as any).currentTrackIndex].key;
        const curMusic = this.sound.get(curKey) as Phaser.Sound.WebAudioSound;
        if (curMusic && curMusic.isPlaying) {
          const seek = curMusic.seek;
          localStorage.setItem('musicSeek', seek.toString());
          (this as any).updateSeekUIRef?.(seek, curMusic.duration);
        }
      }
    });

    // Explicitly enforce volume
    music.setVolume(initVolume);`;

if (!content.includes(topTarget)) { console.log("Missing topTarget"); }
content = content.replace(topTarget, topReplace);


// Replace 2: Track Info Row
const infoTarget = `    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&#9654;&#9654;'; // ?
    nextBtn.style.background = 'none';
    nextBtn.style.border = 'none';
    nextBtn.style.color = '#94a3b8';
    nextBtn.style.cursor = 'pointer';
    nextBtn.style.fontSize = '14px';

    trackInfoRow.appendChild(prevBtn);
    trackInfoRow.appendChild(trackDetails);
    trackInfoRow.appendChild(nextBtn);`;

const infoReplace = `    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '&#9654;&#9654;'; // ?
    nextBtn.style.background = 'none';
    nextBtn.style.border = 'none';
    nextBtn.style.color = '#94a3b8';
    nextBtn.style.cursor = 'pointer';
    nextBtn.style.fontSize = '14px';

    const repeatBtn = document.createElement('button');
    repeatBtn.innerHTML = '&#128257;'; // ??
    repeatBtn.style.background = 'none';
    repeatBtn.style.border = 'none';
    const isRepeating = localStorage.getItem('musicRepeat') === 'true';
    repeatBtn.style.color = isRepeating ? '#10b981' : '#94a3b8';
    repeatBtn.style.cursor = 'pointer';
    repeatBtn.style.fontSize = '14px';
    repeatBtn.style.marginLeft = '4px';

    trackInfoRow.appendChild(prevBtn);
    trackInfoRow.appendChild(trackDetails);
    trackInfoRow.appendChild(nextBtn);
    trackInfoRow.appendChild(repeatBtn);`;

if (!content.includes(infoTarget)) { console.log("Missing infoTarget"); }
content = content.replace(infoTarget, infoReplace);

// Replace 3: Volume Row (prepend seek bar)
const volTarget = `    // Volume Row
    const volumeRow = document.createElement('div');`;

const volReplace = `    // Seek Row
    const seekRow = document.createElement('div');
    seekRow.style.display = 'flex';
    seekRow.style.alignItems = 'center';
    seekRow.style.gap = '8px';
    seekRow.style.justifyContent = 'center';
    seekRow.style.marginTop = '4px';
    seekRow.style.marginBottom = '4px';

    const timeDisplay = document.createElement('div');
    timeDisplay.style.fontSize = '10px';
    timeDisplay.style.color = '#94a3b8';
    timeDisplay.style.minWidth = '55px';
    timeDisplay.style.textAlign = 'right';
    timeDisplay.innerText = '0:00 / 0:00';
    timeDisplay.style.fontVariantNumeric = 'tabular-nums';

    const seekSlider = document.createElement('input');
    seekSlider.type = 'range';
    seekSlider.min = '0';
    seekSlider.max = '100';
    seekSlider.value = '0';
    seekSlider.style.flex = '1';
    
    seekRow.appendChild(seekSlider);
    seekRow.appendChild(timeDisplay);

    // Volume Row
    const volumeRow = document.createElement('div');`;

if (!content.includes(volTarget)) { console.log("Missing volTarget"); }
content = content.replace(volTarget, volReplace);

// Replace 4: Append seekRow
const appendTarget = `    playerContainer.appendChild(trackInfoRow);
    playerContainer.appendChild(volumeRow);`;

const appendReplace = `    playerContainer.appendChild(trackInfoRow);
    playerContainer.appendChild(seekRow);
    playerContainer.appendChild(volumeRow);`;

if (!content.includes(appendTarget)) { console.log("Missing appendTarget"); }
content = content.replace(appendTarget, appendReplace);

// Replace 5: Playback Logic
const playTarget = `    // Playback Logic
    const activePlaylist = (this as any).playlist;
    
    const updatePlayerUI = () => {
      const idx = (this as any).currentTrackIndex;
      trackTitle.innerText = activePlaylist[idx].title;
      trackArtist.innerText = activePlaylist[idx].artist;
    };
    
    updatePlayerUI(); // Init

    const changeTrack = (dir: number) => {
      // Stop current
      const oldIdx = (this as any).currentTrackIndex;
      this.sound.stopByKey(activePlaylist[oldIdx].key);
      
      // Update index
      let newIdx = oldIdx + dir;
      if (newIdx < 0) newIdx = activePlaylist.length - 1;
      if (newIdx >= activePlaylist.length) newIdx = 0;
      (this as any).currentTrackIndex = newIdx;
      localStorage.setItem('currentTrackIndex', newIdx.toString());
      
      // Play new
      const vol = parseFloat(volumeSlider.value);
      this.sound.play(activePlaylist[newIdx].key, { loop: true, volume: vol });
      
      updatePlayerUI();
    };

    prevBtn.addEventListener('click', () => changeTrack(-1));
    nextBtn.addEventListener('click', () => changeTrack(1));

    volumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat((e.target as HTMLInputElement).value);
      localStorage.setItem('musicVolume', vol.toString());
      
      const currentTrackKey = activePlaylist[(this as any).currentTrackIndex].key;
      const music = this.sound.get(currentTrackKey);
      if (music) {
        (music as Phaser.Sound.WebAudioSound).setVolume(vol);
      }
    });`;

const playReplace = `    // Playback Logic
    const activePlaylist = (this as any).playlist;
    
    const updatePlayerUI = () => {
      const idx = (this as any).currentTrackIndex;
      trackTitle.innerText = activePlaylist[idx].title;
      trackArtist.innerText = activePlaylist[idx].artist;
    };
    
    updatePlayerUI(); // Init

    let isDraggingSeek = false;
    (this as any).updateSeekUIRef = (seek, duration) => {
      if (isDraggingSeek || isNaN(duration)) return;
      seekSlider.max = duration.toString();
      seekSlider.value = seek.toString();
      
      const formatTime = (s) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return \`\${mins}:\${secs.toString().padStart(2, '0')}\`;
      };
      const timeLeft = duration - seek;
      timeDisplay.innerText = \`\${formatTime(seek)} / -\${formatTime(timeLeft)}\`;
    };

    const changeTrack = (dir) => {
      // Stop current
      const oldIdx = (this as any).currentTrackIndex;
      this.sound.stopByKey(activePlaylist[oldIdx].key);
      
      // Update index
      let newIdx = oldIdx + dir;
      if (newIdx < 0) newIdx = activePlaylist.length - 1;
      if (newIdx >= activePlaylist.length) newIdx = 0;
      (this as any).currentTrackIndex = newIdx;
      localStorage.setItem('currentTrackIndex', newIdx.toString());
      
      // Play new
      const vol = parseFloat(volumeSlider.value);
      const curKey = activePlaylist[newIdx].key;
      let newMusic = this.sound.get(curKey);
      if (!newMusic) newMusic = this.sound.add(curKey);
      
      newMusic.removeAllListeners('complete');
      newMusic.on('complete', () => {
        const rep = localStorage.getItem('musicRepeat') === 'true';
        if (!rep) changeTrack(1);
        else newMusic.play({ volume: parseFloat(volumeSlider.value) });
      });
      newMusic.play({ volume: vol });
      
      updatePlayerUI();
    };
    (this as any).changeTrackRef = changeTrack;

    repeatBtn.addEventListener('click', () => {
      const currentRep = localStorage.getItem('musicRepeat') === 'true';
      const newRep = !currentRep;
      localStorage.setItem('musicRepeat', newRep.toString());
      repeatBtn.style.color = newRep ? '#10b981' : '#94a3b8';
    });

    seekSlider.addEventListener('mousedown', () => isDraggingSeek = true);
    seekSlider.addEventListener('touchstart', () => isDraggingSeek = true);
    
    const applySeek = () => {
      isDraggingSeek = false;
      const curKey = activePlaylist[(this as any).currentTrackIndex].key;
      const music = this.sound.get(curKey);
      if (music && music.isPlaying) {
        const vol = parseFloat(volumeSlider.value);
        const seekVal = parseFloat(seekSlider.value);
        music.play({ seek: seekVal, volume: vol });
        localStorage.setItem('musicSeek', seekVal.toString());
      }
    };
    
    seekSlider.addEventListener('mouseup', applySeek);
    seekSlider.addEventListener('touchend', applySeek);
    seekSlider.addEventListener('change', applySeek);

    prevBtn.addEventListener('click', () => changeTrack(-1));
    nextBtn.addEventListener('click', () => changeTrack(1));

    volumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      localStorage.setItem('musicVolume', vol.toString());
      
      const curKey = activePlaylist[(this as any).currentTrackIndex].key;
      const music = this.sound.get(curKey);
      if (music) {
        music.setVolume(vol);
      }
    });`;

if (!content.includes(playTarget)) { console.log("Missing playTarget"); }
content = content.replace(playTarget, playReplace);

fs.writeFileSync('src/scenes/LevelSelectScene.ts', content);
console.log("Successfully patched LevelSelectScene.ts");
