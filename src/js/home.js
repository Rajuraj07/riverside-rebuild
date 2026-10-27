document.addEventListener("DOMContentLoaded", () => {
  // 1. Tab Section Functionality
  let eteInitializedOnce = false;
  const thresholdVal = window.innerWidth < 767 ? 0.3 : 0.1;

  function initEteSection() {
    const isMobile = window.innerWidth < 1024;
    const freshItems = document.querySelectorAll(".ete__item");
    if (!freshItems.length) return;

    // ==========================================
    // DESKTOP LOGIC (>= 1024px)
    // ==========================================
    if (!isMobile) {
      const container = document.querySelector(".ete__video-container");
      if (!container) return;

      let currentIndex = 0;
      const videos = [];

      // Remove any previously appended dynamic videos
      container.querySelectorAll(".ete__video").forEach(v => v.remove());

      // Reset active states
      freshItems.forEach(item => item.classList.remove("active"));

      // Inject video shells with lazy-loading support
      freshItems.forEach((item, index) => {
        const videoUrl = item.dataset.eteVideo;
        const poster = item.dataset.etePoster;

        const v = document.createElement("video");
        v.className = "ete__video";
        if (poster) v.poster = poster;
        v.dataset.src = videoUrl;
        v.preload = "none";
        v.muted = true;
        v.playsInline = true;
        v.autoplay = false;

        // Apply native layout styles (No Tailwind classes mixed into JS)
        v.style.position = "absolute";
        v.style.top = "0";
        v.style.left = "0";
        v.style.width = "100%";
        v.style.height = "100%";
        v.style.objectFit = "cover";
        v.style.transition = "opacity 0.4s ease";
        v.style.opacity = index === 0 ? "1" : "0";
        v.style.zIndex = index === 0 ? "1" : "0";

        container.appendChild(v);
        videos.push(v);
      });

      // Lazy load helper
      function loadVideoSource(v) {
        if (v && !v.src && v.dataset.src) {
          v.src = v.dataset.src;
          v.load();
        }
      }

      function showVideo(index) {
        if (index < 0 || index >= videos.length) return;
        currentIndex = index;

        const activeVideo = videos[index];
        loadVideoSource(activeVideo);

        // Preload next clip in background for seamless transitions
        const nextIndex = (index + 1) % videos.length;
        loadVideoSource(videos[nextIndex]);

        // Toggle visibility and play/pause state
        videos.forEach((v, i) => {
          const active = i === index;
          v.style.opacity = active ? "1" : "0";
          v.style.zIndex = active ? "1" : "0";

          if (active) {
            v.currentTime = 0;
            v.play().catch(() => {});
          } else {
            v.pause();
            if (v.src) v.currentTime = 0;
          }
        });

        // Update active tab class
        freshItems.forEach((it, i) => {
          it.classList.toggle("active", i === index);
        });
      }

      // Auto-advance to next tab on video completion
      videos.forEach((v, i) => {
        v.addEventListener("ended", () => {
          let next = i + 1;
          if (next >= videos.length) next = 0;
          showVideo(next);
        });
      });

      // Tab Click Handlers
      freshItems.forEach((item, i) => {
        item.onclick = () => showVideo(i);
      });

      // Play initial tab
      showVideo(0);

      // Cleanup function when switching viewports
      return () => {
        videos.forEach(v => {
          v.pause();
          v.style.opacity = "0";
          v.style.zIndex = "0";
        });
        freshItems.forEach(item => item.classList.remove("active"));
        currentIndex = 0;
      };
    }

    // ==========================================
    // MOBILE LOGIC (< 1024px) - ACCORDION
    // ==========================================
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    freshItems.forEach((item, index) => {
      const url = item.dataset.eteVideo;
      const poster = item.dataset.etePoster;
      if (!url) return;

      let wrapper = item.querySelector(".ete__video-wrap");
      if (!wrapper) {
        wrapper = document.createElement("div");
        wrapper.className = "ete__video-wrap";
        wrapper.style.overflow = "hidden";
        wrapper.style.maxHeight = "0";
        wrapper.style.transition = "max-height 0.4s ease";
        wrapper.style.borderRadius = "8px";
        item.append(wrapper);
      }

      let video = wrapper.querySelector("video");
      if (!video) {
        video = document.createElement("video");
        const source = document.createElement("source");
        source.type = "video/mp4";
        video.appendChild(source);

        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        video.setAttribute("loop", "");
        video.muted = true;
        video.playsInline = true;
        video.style.width = "100%";
        video.style.height = "auto";
        video.style.opacity = "0";
        video.style.transition = "opacity 0.3s ease";
        video.style.borderRadius = "8px";
        video.style.marginTop = "12px";

        if (poster) video.setAttribute("poster", poster);

        if (isIOS) {
          source.src = url;
          video.load();
        } else {
          source.setAttribute("data-src", url);
        }
        wrapper.append(video);
      }

      const arrow = item.querySelector(".ete__arrow");

      item.onclick = () => {
        const source = video.querySelector("source");
        if (!isIOS && source && !source.getAttribute("src")) {
          const src = source.getAttribute("data-src");
          source.setAttribute("src", src);
          video.load();
        }

        const isOpen = item.classList.contains("open");

        freshItems.forEach(other => {
          if (other !== item) {
            other.classList.remove("open");
            const ow = other.querySelector(".ete__video-wrap");
            const ov = ow?.querySelector("video");
            const oa = other.querySelector(".ete__arrow");
            if (ow) ow.style.maxHeight = "0";
            if (ov) { ov.pause(); ov.currentTime = 0; ov.style.opacity = "0"; }
            if (oa) oa.style.transform = "rotate(0deg)";
          }
        });

        if (isOpen) {
          item.classList.remove("open");
          wrapper.style.maxHeight = "0";
          video.pause();
          video.currentTime = 0;
          video.style.opacity = "0";
          if (arrow) arrow.style.transform = "rotate(0deg)";
        } else {
          item.classList.add("open");
          const h = video.videoHeight && video.videoWidth
            ? (video.videoHeight / video.videoWidth) * video.offsetWidth
            : wrapper.scrollHeight || 240;

          wrapper.style.maxHeight = h + "px";
          video.currentTime = 0;
          video.play().catch(() => {});
          video.style.opacity = "1";
          if (arrow) arrow.style.transform = "rotate(90deg)";
        }
      };

      if (index === 0 && !eteInitializedOnce) {
        eteInitializedOnce = true;
        if (!isIOS) {
          const s = video.querySelector("source");
          if (s) {
            s.setAttribute("src", s.getAttribute("data-src"));
            video.load();
          }
        }
        item.classList.add("open");
        const h = video.videoHeight && video.videoWidth
          ? (video.videoHeight / video.videoWidth) * video.offsetWidth
          : 240;
        wrapper.style.maxHeight = h + "px";
        video.style.opacity = "1";
        video.play().catch(() => {});
        if (arrow) arrow.style.transform = "rotate(90deg)";
      }
    });
  }

  // Intersection Observer to observe element visibility
  const eteSection = document.querySelector(".ete__wrapper");
  if (eteSection) {
    let resetFn = null;
    let mobileInitialized = false;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const isMobile = window.innerWidth < 1024;
        if (entry.isIntersecting) {
          if (isMobile && !mobileInitialized) {
            mobileInitialized = true;
            initEteSection();
          }
          if (!isMobile && !resetFn) {
            resetFn = initEteSection();
          }
        } else {
          if (!isMobile && resetFn) {
            resetFn();
            resetFn = null;
          }
        }
      });
    }, { threshold: thresholdVal, rootMargin: "100px 0px" });

    observer.observe(eteSection);
  }
  
  // 2. Lazy video functionality
  const lazyVideos = document.querySelectorAll("video[data-video-src]");

  const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const video = entry.target;
          const src = video.getAttribute("data-video-src");

          if (src) {
            const source = document.createElement("source");
            source.src = src;
            source.type = "video/mp4";
            video.appendChild(source);
            video.load();
            video.play().catch(() => {});

            obs.unobserve(video);
          }
        }
      });
  }, {
      rootMargin: "200px 0px",
      threshold: 0.1
  });

  lazyVideos.forEach(v => observer.observe(v));

  // 3. Responsive Video with lazy loading
  function setupInteractiveVideoObserver(selector) {
    const video = document.querySelector(selector);
    if (!video) return;

    const source = video.querySelector("source");
    if (!source) return;

    let initialized = false;

    // Helper to check device state dynamically
    const checkIsMobile = () => window.matchMedia("(max-width: 767px)").matches;

    function initVideo() {
      if (initialized) return;
      initialized = true;

      const isMobile = checkIsMobile();
      const chosenSrc = isMobile 
        ? source.getAttribute("data-src-mobile") 
        : source.getAttribute("data-src-desktop");

      // Only set src and load if it hasn't been set yet
      if (chosenSrc && source.getAttribute("src") !== chosenSrc) {
        source.setAttribute("src", chosenSrc);
        video.load();
      }

      const posterDesktop = source.getAttribute("data-poster-desktop");
      const posterMobile = source.getAttribute("data-poster-mobile");
      if (posterDesktop && posterMobile) {
        video.poster = isMobile ? posterMobile : posterDesktop;
      }
    }

    // Safe wrapper for video play to handle AbortErrors cleanly
    const playVideo = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Suppress benign DOMException errors when play() is interrupted by pause()
          if (error.name !== "AbortError") {
            console.warn("Video playback was prevented:", error);
          }
        });
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            initVideo();
            if (video.readyState >= 2) {
              video.currentTime = 0;
              playVideo();
            } else {
              video.addEventListener("canplay", playVideo, { once: true });
            }
          } else {
            // Reset sound state and pause when out of view
            const wrapper = video.closest("[data-sound-wrap]");
            const soundBtn = wrapper?.querySelector("[data-sound]");
            const soundText = soundBtn?.querySelector(".sound__text");
            
            if (soundBtn && soundText && soundText.textContent.trim().toLowerCase() === "mute") {
              soundBtn.click();
            }
            video.pause();
            video.currentTime = 0;
          }
        });
      },
      { threshold: [0.2], rootMargin: "50px 0px" }
    );

    observer.observe(video);

    // Sound button interaction
    const soundBtn = video.closest("[data-sound-wrap]")?.querySelector("[data-sound]");
    if (soundBtn) {
      soundBtn.addEventListener("click", () => {
        video.currentTime = 0;
        playVideo();
      });
    }

    // Initial check for elements already in the viewport on page load
    const rect = video.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      initVideo();
      playVideo();
    }

    return () => {
      observer.disconnect();
    };
  }
  setupInteractiveVideoObserver("#compareVideo");
  //3. Setup Auto Observaton video
  function setupAutoVideoObserver(selector) {
    const video = document.querySelector(selector);
    if (!video) return;

    const source = video.querySelector("source");
    if (!source) return;

    let initialized = false;

    // Helper to check device state dynamically
    const checkIsMobile = () => window.matchMedia("(max-width: 767px)").matches;

    function initVideo() {
      if (initialized) return;
      initialized = true;

      const isMobile = checkIsMobile();
      const chosenSrc = isMobile 
        ? source.getAttribute("data-src-mobile") 
        : source.getAttribute("data-src-desktop");

      // Only set src and load if a new source exists and differs from the current one
      if (chosenSrc && source.getAttribute("src") !== chosenSrc) {
        source.setAttribute("src", chosenSrc);
        video.load();
      }

      const posterDesktop = source.getAttribute("data-poster-desktop");
      const posterMobile = source.getAttribute("data-poster-mobile");
      if (posterDesktop && posterMobile) {
        video.poster = isMobile ? posterMobile : posterDesktop;
      }
    }

    // Safe wrapper for video play to handle AbortErrors cleanly
    const playVideo = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          // Suppress benign DOMException errors when play() is interrupted by pause()
          if (error.name !== "AbortError") {
            console.warn("Video playback was prevented:", error);
          }
        });
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            initVideo();
            if (video.readyState >= 2) {
              video.currentTime = 0;
              playVideo();
            } else {
              video.addEventListener("canplay", playVideo, { once: true });
            }
          } else {
            video.pause();
            video.currentTime = 0;
          }
        });
      },
      { threshold: [0], rootMargin: "200px 0px" }
    );

    observer.observe(video);

    // Initial check for elements already in the viewport on page load
    const rect = video.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      initVideo();
      playVideo();
    }

    // Expose a teardown method for dynamic components or SPAs
    return () => {
      observer.disconnect();
    };
  }
  setupAutoVideoObserver("#coCreatorVideo");
  //4. Hoe Tab Functionality
  const items = document.querySelectorAll(".hoe__nav-item");
  const desktopVideoSource = document.getElementById("desktop-video-source");
  const desktopVideoElement = document.getElementById("desktop-active-video");
  const desktopBadge = document.querySelector(".hoe__content .sound__badge");

  function isMobileViewport() {
    return window.innerWidth < 768;
  }

  function handleLayoutMode() {
    if (isMobileViewport()) {
      items.forEach((e) => {
        e.classList.remove("is--active");
        let o = e.querySelector(".hoe__text");
        let badge = e.querySelector(".sound__badge");
        if (o) {
          o.style.maxHeight = "none";
          o.style.opacity = "1";
        }
        if (badge) {
          badge.style.display = "flex";
        }
      });
      if (desktopBadge) desktopBadge.style.display = "none";
    } else {
      let activeItem = document.querySelector(".hoe__nav-item.is--active") || items[0];
      if (activeItem) {
        updateActiveTab(activeItem);
      }
    }
  }

  function updateActiveTab(e) {
    if (isMobileViewport()) return;
    let t = e.getAttribute("data-video-src");
    if (t && desktopVideoSource && desktopVideoElement) {
      desktopVideoSource.src = t;
      desktopVideoElement.load();
      desktopVideoElement.play().catch(() => {});
      desktopVideoElement.muted = true;
      updateBadgeState(desktopBadge, true);
    }

    // Check if the current active tab is the first item (index 0)
    let index = Array.from(items).indexOf(e);
    if (desktopBadge) {
      desktopBadge.style.display = (index === 0) ? "flex" : "none";
    }

    items.forEach(t => {
      let o = t.querySelector(".hoe__text");
      if (t === e) {
        t.classList.add("is--active");
        if (o) {
          o.style.maxHeight = o.scrollHeight + "px";
          o.style.opacity = "1";
        }
      } else {
        t.classList.remove("is--active");
        if (o) {
          o.style.maxHeight = "0px";
          o.style.opacity = "0";
        }
      }
    });
  }

  const soundOnSvg = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.02v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>';
  const soundOffSvg = '<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 1.5L15 9.5l-2 2-2-2-1.5 1.5 2 2-2 2 1.5 1.5 2-2 2 2 1.5-1.5-2-2 2-2z"/></svg>';

  function updateBadgeState(badge, isMuted) {
    if (!badge) return;
    let svgContainer = badge.querySelector("svg");
    let textDiv = badge.querySelector("div:not(.w-4)") || badge.querySelector("div");
    if (isMuted) {
      if (svgContainer) svgContainer.outerHTML = soundOnSvg;
      if (textDiv) textDiv.textContent = "Listen";
    } else {
      if (svgContainer) svgContainer.outerHTML = soundOffSvg;
      if (textDiv) textDiv.textContent = "Mute";
    }
  }

  function setupSoundToggles() {
    let badges = document.querySelectorAll(".sound__badge");
    badges.forEach(badge => {
      badge.addEventListener("click", t => {
        t.stopPropagation();
        let outer = badge.closest(".hoe-video__outer") || badge.closest(".hoe__content");
        let video = outer ? outer.querySelector("video") : null;
        if (video) {
          video.muted = !video.muted;
          updateBadgeState(badge, video.muted);
        }
      });
    });
  }

  items.forEach(e => {
    e.addEventListener("click", () => {
      updateActiveTab(e);
    });
  });

  setupSoundToggles();
  handleLayoutMode();

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      handleLayoutMode();
    }, 100);
  });

  //5. header button animation helper code
  const checkboxes = document.querySelectorAll('.option-checkbox');
  const button = document.getElementById('animated-button');

  function updateButtonState() {
    const isAnyChecked = Array.from(checkboxes).some(checkbox => checkbox.checked);
    button.classList.toggle('is-active', isAnyChecked);
  }

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', updateButtonState);
  });

});