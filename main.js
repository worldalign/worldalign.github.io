/* Copyright 2026 Jayce-Ping. Licensed under the Apache License, Version 2.0. */
"use strict";

const teaserVideos = [...document.querySelectorAll(".teaser-canvas video")];
const teaserButton = document.querySelector("#teaser-toggle");
const teaserStatus = document.querySelector("#teaser-status");
let teaserPlaying = false;
let playbackRequest = 0;

async function playTeaser() {
  const request = ++playbackRequest;
  teaserStatus.textContent = "";
  teaserVideos.forEach(video => { video.currentTime = 0; });
  const results = await Promise.allSettled(teaserVideos.map(video => video.play()));
  if (request !== playbackRequest) return;
  teaserPlaying = results.every(result => result.status === "fulfilled");
  if (!teaserPlaying) {
    teaserVideos.forEach(video => video.pause());
    teaserStatus.textContent = "Playback could not start. Please try Play teaser again.";
  }
  teaserButton.textContent = teaserPlaying ? "Pause teaser" : "Play teaser";
}

teaserButton.addEventListener("click", () => {
  if (teaserPlaying) {
    playbackRequest++;
    teaserVideos.forEach(video => video.pause());
    teaserPlaying = false;
    teaserButton.textContent = "Play teaser";
  } else {
    playTeaser();
  }
});
document.querySelector("#teaser-restart").addEventListener("click", playTeaser);
document.querySelector("#teaser-speed").addEventListener("change", event => {
  teaserVideos.forEach(video => { video.playbackRate = Number(event.target.value); });
});

if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  let started = false;
  const teaserObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !started) {
        started = true;
        playTeaser();
      } else if (!entry.isIntersecting && teaserPlaying) {
        playbackRequest++;
        teaserVideos.forEach(video => video.pause());
        teaserPlaying = false;
        teaserButton.textContent = "Play teaser";
      }
    });
  }, { threshold: 0.1 });
  teaserObserver.observe(document.querySelector(".teaser-canvas"));
}

// Keep all four embedded panels on the same timeline.
teaserVideos[0].addEventListener("timeupdate", () => {
  if (!teaserPlaying) return;
  teaserVideos.slice(1).forEach(video => {
    if (Math.abs(video.currentTime - teaserVideos[0].currentTime) > 0.15) {
      video.currentTime = teaserVideos[0].currentTime;
    }
  });
});

const cards = [...document.querySelectorAll(".case")];
const category = document.querySelector("#category");
const more = document.querySelector("#load-more");
const count = document.querySelector("#case-count");
let shown = 4;
function updateGallery() {
  let matched = 0;
  cards.forEach(card => {
    const match = category.value === "all" || card.dataset.category === category.value;
    const visible = match && ++matched <= shown;
    card.hidden = !visible;
    if (!visible) card.querySelector("video").pause();
  });
  count.textContent = `${Math.min(shown, matched)} of ${matched} selected comparisons`;
  more.hidden = shown >= matched;
}
category.addEventListener("change", () => { shown = 4; updateGallery(); });
more.addEventListener("click", () => { shown += 4; updateGallery(); });
document.querySelector("#gallery-pause").addEventListener("click", () => {
  cards.forEach(card => card.querySelector("video").pause());
});
document.querySelector("#gallery-speed").addEventListener("change", event => {
  cards.forEach(card => { card.querySelector("video").playbackRate = Number(event.target.value); });
});

// Load comparison videos on approach; hidden examples stay unloaded.
if ("IntersectionObserver" in window) {
  const loader = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) { target.pause(); return; }
      if (!target.getAttribute("src")) {
        target.src = target.canPlayType('video/mp4; codecs="avc1.64001f"') ? target.dataset.src : target.dataset.src.replace(".mp4", ".webm");
        target.load();
      }
    });
  }, { rootMargin: "200px 0px" });
  cards.forEach(card => loader.observe(card.querySelector("video")));
} else {
  cards.forEach(card => { const video = card.querySelector("video"); video.src = video.canPlayType('video/mp4; codecs="avc1.64001f"') ? video.dataset.src : video.dataset.src.replace(".mp4", ".webm"); });
}
document.querySelectorAll("video").forEach(video => {
  video.addEventListener("error", () => {
    if (video.closest(".teaser-canvas")) teaserStatus.textContent = "A teaser video could not load. Please reload the page.";
    else video.closest(".case").querySelector(".case-note").textContent = "Video could not load. Please reload the page.";
  });
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) return;
  playbackRequest++;
  document.querySelectorAll("video").forEach(video => video.pause());
  teaserPlaying = false;
  teaserButton.textContent = "Play teaser";
});
updateGallery();
