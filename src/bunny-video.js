// -----------------------------------------
// BUNNY BACKGROUND VIDEO — HLS adaptive streaming
// Based on Osmo's Bunny HLS Background Video component
// Requires hls.js loaded externally (Safari uses native HLS)
// -----------------------------------------

let initializedPlayers = [];

export function initBunnyBackground(scope) {
  scope = scope || document;

  scope.querySelectorAll('[data-bunny-background-init]').forEach(function(player) {
    var src = player.getAttribute('data-player-src');
    if (!src) return;

    var video = player.querySelector('video');
    if (!video) return;

    try { video.pause(); } catch(_) {}
    try { video.removeAttribute('src'); video.load(); } catch(_) {}

    // Attribute helpers
    function setStatus(s) {
      if (player.getAttribute('data-player-status') !== s) {
        player.setAttribute('data-player-status', s);
      }
    }
    function setActivated(v) { player.setAttribute('data-player-activated', v ? 'true' : 'false'); }
    if (!player.hasAttribute('data-player-activated')) setActivated(false);

    // Flags
    var lazyMode   = player.getAttribute('data-player-lazy');
    var isLazyTrue = lazyMode === 'true';
    var autoplay   = player.getAttribute('data-player-autoplay') === 'true';
    var initialMuted = player.getAttribute('data-player-muted') === 'true';

    var pendingPlay = false;

    if (autoplay) { video.muted = true; video.loop = true; }
    else { video.muted = initialMuted; }

    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
    if (autoplay) video.autoplay = false;

    var isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
    var canUseHlsJs    = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

    var isAttached = false;
    var lastPauseBy = '';

    function attachMediaOnce() {
      if (isAttached) return;
      isAttached = true;

      if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }

      if (isSafariNative) {
        video.preload = isLazyTrue ? 'none' : 'auto';
        video.src = src;
        video.addEventListener('loadedmetadata', function() {
          readyIfIdle(player, pendingPlay);
        }, { once: true });
      } else if (canUseHlsJs) {
        var hls = new Hls({ maxBufferLength: 10 });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function() { hls.loadSource(src); });
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          readyIfIdle(player, pendingPlay);
        });
        player._hls = hls;
      } else {
        video.src = src;
      }
    }

    if (isLazyTrue) {
      video.preload = 'none';
    } else {
      attachMediaOnce();
    }

    function togglePlay() {
      if (video.paused || video.ended) {
        if (isLazyTrue && !isAttached) attachMediaOnce();
        pendingPlay = true;
        lastPauseBy = '';
        setStatus('loading');
        safePlay(video);
      } else {
        lastPauseBy = 'manual';
        video.pause();
      }
    }

    function toggleMute() {
      video.muted = !video.muted;
      player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
    }

    // Controls (delegated within player)
    function onPlayerClick(e) {
      var btn = e.target.closest('[data-player-control]');
      if (!btn || !player.contains(btn)) return;
      var type = btn.getAttribute('data-player-control');
      if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
      else if (type === 'mute') toggleMute();
    }
    player.addEventListener('click', onPlayerClick);

    // Media event handlers
    function onPlay() { setActivated(true); setStatus('playing'); }
    function onPlaying() { pendingPlay = false; setStatus('playing'); }
    function onPause() { pendingPlay = false; setStatus('paused'); }
    function onWaiting() { setStatus('loading'); }
    function onCanplay() { readyIfIdle(player, pendingPlay); }
    function onEnded() { pendingPlay = false; setStatus('paused'); setActivated(false); }

    video.addEventListener('play', onPlay);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('canplay', onCanplay);
    video.addEventListener('ended', onEnded);

    // In-view auto play/pause
    var io = null;
    if (autoplay) {
      if (player._io) { try { player._io.disconnect(); } catch(_) {} }
      io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          var inView = entry.isIntersecting && entry.intersectionRatio > 0;
          if (inView) {
            if (isLazyTrue && !isAttached) attachMediaOnce();
            if ((lastPauseBy === 'io') || (video.paused && lastPauseBy !== 'manual')) {
              setStatus('loading');
              if (video.paused) togglePlay();
              lastPauseBy = '';
            }
          } else {
            if (!video.paused && !video.ended) {
              lastPauseBy = 'io';
              video.pause();
            }
          }
        });
      }, { threshold: 0.1 });
      io.observe(player);
      player._io = io;
    }

    // Store cleanup references
    initializedPlayers.push({
      player,
      video,
      io,
      onPlayerClick,
      onPlay,
      onPlaying,
      onPause,
      onWaiting,
      onCanplay,
      onEnded,
    });
  });
}

export function destroyBunnyBackground() {
  initializedPlayers.forEach(function({ player, video, io, onPlayerClick, onPlay, onPlaying, onPause, onWaiting, onCanplay, onEnded }) {
    // Disconnect IntersectionObserver
    if (io) { try { io.disconnect(); } catch(_) {} }
    if (player._io) { try { player._io.disconnect(); } catch(_) {} player._io = null; }

    // Destroy HLS instance
    if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }

    // Pause and detach video
    try { video.pause(); } catch(_) {}
    try { video.removeAttribute('src'); video.load(); } catch(_) {}

    // Remove event listeners
    player.removeEventListener('click', onPlayerClick);
    video.removeEventListener('play', onPlay);
    video.removeEventListener('playing', onPlaying);
    video.removeEventListener('pause', onPause);
    video.removeEventListener('waiting', onWaiting);
    video.removeEventListener('canplay', onCanplay);
    video.removeEventListener('ended', onEnded);

    // Reset attributes
    player.setAttribute('data-player-status', 'idle');
    player.setAttribute('data-player-activated', 'false');
  });

  initializedPlayers = [];
}

// Helpers
function readyIfIdle(player, pendingPlay) {
  if (!pendingPlay &&
      player.getAttribute('data-player-activated') !== 'true' &&
      player.getAttribute('data-player-status') === 'idle') {
    player.setAttribute('data-player-status', 'ready');
  }
}

function safePlay(video) {
  var p = video.play();
  if (p && typeof p.then === 'function') p.catch(function(){});
}
