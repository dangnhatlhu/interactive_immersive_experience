(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const cursor = document.querySelector(".cursor--main");
  const trails = [...document.querySelectorAll(".cursor--trail")];
  const hero = document.querySelector(".hero");
  const heroArt = document.querySelector(".hero-art");
  const magneticButtons = [...document.querySelectorAll(".magnetic")];
  const nav = document.querySelector(".site-nav");
  const menuToggle = document.querySelector(".menu-toggle");

  // Lerp moves a value toward its target by a fixed proportion each frame.
  const lerp = (current, target, amount) => current + (target - current) * amount;
  const pointer = { x: -100, y: -100, active: false, hovering: false };
  const trailPositions = trails.map(() => ({ x: -100, y: -100 }));
  const magneticPositions = new Map();
  let cursorFrame = 0;
  let magneticFrame = 0;
  let parallaxFrame = 0;
  let heroVisible = false;

  if (finePointer.matches && !reduceMotion.matches) {
    document.body.classList.add("cursor-ready");

    const positionCursor = () => {
      cursorFrame = 0;
      pointer.x = lerp(pointer.x, pointer.targetX, 0.17);
      pointer.y = lerp(pointer.y, pointer.targetY, 0.17);
      cursor.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0) translate(-50%, -50%)`;
      let moving = Math.abs(pointer.targetX - pointer.x) > 0.08 ||
        Math.abs(pointer.targetY - pointer.y) > 0.08;

      trails.forEach((trail, index) => {
        const position = trailPositions[index];
        const ease = 0.28 - index * 0.045;
        position.x = lerp(position.x, pointer.x, ease);
        position.y = lerp(position.y, pointer.y, ease);
        trail.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`;
        if (Math.abs(pointer.x - position.x) > 0.08 || Math.abs(pointer.y - position.y) > 0.08) {
          moving = true;
        }
      });
      if (moving) cursorFrame = requestAnimationFrame(positionCursor);
    };

    document.addEventListener("mousemove", (event) => {
      if (reduceMotion.matches) return;
      pointer.targetX = event.clientX;
      pointer.targetY = event.clientY;
      if (!pointer.active) {
        pointer.active = true;
        pointer.x = event.clientX;
        pointer.y = event.clientY;
        trailPositions.forEach((position) => {
          position.x = event.clientX;
          position.y = event.clientY;
        });
      }
      if (!cursorFrame) cursorFrame = requestAnimationFrame(positionCursor);

      // Cached centers avoid reading layout on every mouse move.
      magneticButtons.forEach((button) => {
        const position = magneticPositions.get(button);
        if (!position) return;
        const deltaX = event.clientX - position.centerX;
        const deltaY = event.clientY - position.centerY;
        const distance = Math.hypot(deltaX, deltaY);
        if (distance < 100) {
          const strength = (100 - distance) / 100;
          position.targetX = deltaX * 0.2 * strength;
          position.targetY = deltaY * 0.2 * strength;
        } else {
          position.targetX = 0;
          position.targetY = 0;
        }
      });
      startMagneticAnimation();
    }, { passive: true });

    document.addEventListener("mouseover", (event) => {
      pointer.hovering = Boolean(event.target.closest("a, button"));
      cursor.classList.toggle("is-hovering", pointer.hovering);
    }, { passive: true });

    const measureButtons = () => {
      magneticButtons.forEach((button) => {
        const rect = button.getBoundingClientRect();
        const position = magneticPositions.get(button);
        magneticPositions.set(button, {
          centerX: rect.left + rect.width / 2 - (position?.x ?? 0),
          centerY: rect.top + rect.height / 2 - (position?.y ?? 0),
          targetX: position?.targetX ?? 0,
          targetY: position?.targetY ?? 0,
          x: position?.x ?? 0,
          y: position?.y ?? 0
        });
      });
    };

    const animateMagneticButtons = () => {
      let moving = false;
      magneticPositions.forEach((position, button) => {
        position.x = lerp(position.x, position.targetX, 0.16);
        position.y = lerp(position.y, position.targetY, 0.16);
        button.style.setProperty("--mag-x", `${position.x.toFixed(2)}px`);
        button.style.setProperty("--mag-y", `${position.y.toFixed(2)}px`);
        if (
          Math.abs(position.targetX - position.x) > 0.08 ||
          Math.abs(position.targetY - position.y) > 0.08
        ) {
          moving = true;
        }
      });

      if (moving) {
        magneticFrame = requestAnimationFrame(animateMagneticButtons);
      } else {
        magneticFrame = 0;
      }
    };

    function startMagneticAnimation() {
      if (!magneticFrame) {
        magneticFrame = requestAnimationFrame(animateMagneticButtons);
      }
    }

    const resetMagneticTargets = () => {
      magneticPositions.forEach((position) => {
        position.targetX = 0;
        position.targetY = 0;
      });
      startMagneticAnimation();
    };

    measureButtons();
    window.addEventListener("resize", measureButtons, { passive: true });
    window.addEventListener("scroll", measureButtons, { passive: true });
    document.addEventListener("mouseout", (event) => {
      if (!event.relatedTarget) resetMagneticTargets();
    }, { passive: true });
  }

  // Only update the background while the hero is in view; translateY is half
  // the distance the hero has scrolled past the top of the viewport.
  if (hero && heroArt && !reduceMotion.matches) {
    const heroObserver = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      if (heroVisible) scheduleParallax();
    }, { threshold: 0 });

    const updateParallax = () => {
      parallaxFrame = 0;
      if (!heroVisible) return;
      const distanceScrolled = Math.max(0, -hero.getBoundingClientRect().top);
      heroArt.style.transform = `translate3d(0, ${distanceScrolled * 0.5}px, 0)`;
    };

    function scheduleParallax() {
      if (!parallaxFrame) parallaxFrame = requestAnimationFrame(updateParallax);
    }

    heroObserver.observe(hero);
    window.addEventListener("scroll", scheduleParallax, { passive: true });
    window.addEventListener("resize", scheduleParallax, { passive: true });
  }

  const ideaData = [
    { quote: "Sáng tạo mở lối cho điều chưa tồn tại.", category: "creativity", description: "Biến trí tưởng tượng thành điểm khởi đầu cho khả năng mới." },
    { quote: "Công nghệ khuếch đại trí tưởng tượng.", category: "technology", description: "Công cụ tốt giúp ý tưởng đi xa hơn giới hạn cũ." },
    { quote: "Tương lai bắt đầu từ một câu hỏi.", category: "future", description: "Sự tò mò hôm nay có thể định hình ngày mai." },
    { quote: "Ý tưởng chạm đất, thế giới đổi thay.", category: "creativity", description: "Sáng kiến chỉ thực sự có nghĩa khi tạo ra khác biệt." },
    { quote: "Con người là thuật toán đẹp nhất.", category: "technology", description: "Đặt sự đồng cảm làm trung tâm của mọi đổi mới." },
    { quote: "Tưởng tượng là giao diện đầu tiên.", category: "creativity", description: "Mọi phát minh đều bắt đầu từ điều ta hình dung." },
    { quote: "Dữ liệu kể chuyện, con người tìm ý nghĩa.", category: "technology", description: "Thông tin mở ra góc nhìn, con người tạo nên giá trị." },
    { quote: "Đổi mới là dám nhìn khác đi.", category: "creativity", description: "Một góc nhìn mới có thể mở ra lối đi mới." },
    { quote: "Tương lai không chờ được dự đoán.", category: "future", description: "Tương lai được tạo nên từ những lựa chọn hôm nay." },
    { quote: "Máy móc tính toán, con người mơ ước.", category: "technology", description: "Kết hợp năng lực tính toán với khát vọng sáng tạo." },
    { quote: "Tiến bộ bắt đầu bằng sự tò mò.", category: "future", description: "Câu hỏi đúng có thể thay đổi cả hành trình." },
    { quote: "Sáng tạo biến giới hạn thành chất liệu.", category: "creativity", description: "Thách thức đôi khi chính là nguyên liệu của sáng tạo." }
  ];
  const categoryNames = {
    creativity: "Sáng tạo",
    technology: "Công nghệ",
    future: "Tương lai"
  };
  const pageSize = 6;
  const searchInput = document.querySelector("#idea-search");
  const sortSelect = document.querySelector("#idea-sort");
  const resultList = document.querySelector("#idea-results");
  const resultStatus = document.querySelector("#library-status");
  const pagination = document.querySelector("#pagination");
  const emptyState = document.querySelector("#empty-state");
  const resetSearch = document.querySelector("#reset-search");
  const filterButtons = [...document.querySelectorAll(".filter-chip")];
  const library = { query: "", category: "all", sort: "featured", page: 1 };

  const normalizeText = (text) => text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLocaleLowerCase("vi");

  const revealObserver = reduceMotion.matches
    ? null
    : new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18 });

  function observeReveal(items) {
    items.forEach((item, index) => {
      if (reduceMotion.matches) {
        item.classList.add("is-visible");
        return;
      }
      item.style.setProperty("--reveal-delay", `${Math.min(index, 5) * 65}ms`);
      revealObserver.observe(item);
    });
  }

  function createIdeaCard(idea, index) {
    const card = document.createElement("article");
    card.className = "quote-row reveal-line";

    const top = document.createElement("div");
    top.className = "quote-card-top";
    const number = document.createElement("span");
    number.className = "quote-index";
    number.textContent = `Ý NIỆM ${String(index + 1).padStart(2, "0")}`;
    const category = document.createElement("span");
    category.className = "quote-category";
    category.textContent = categoryNames[idea.category];
    top.append(number, category);

    const quote = document.createElement("h3");
    quote.textContent = idea.quote;
    const description = document.createElement("p");
    description.textContent = idea.description;
    const arrow = document.createElement("span");
    arrow.className = "quote-mark";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";
    card.append(top, quote, description, arrow);
    return card;
  }

  function renderPagination(pageCount) {
    pagination.replaceChildren();
    if (pageCount < 2) return;

    const addPageButton = (label, page, options = {}) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.disabled = Boolean(options.disabled);
      if (options.current) {
        button.setAttribute("aria-current", "page");
        button.setAttribute("aria-label", `Trang ${page}, hiện tại`);
      } else {
        button.setAttribute("aria-label", options.label ?? `Đến trang ${page}`);
      }
      button.addEventListener("click", () => {
        library.page = page;
        renderLibrary();
        document.querySelector("#idea-results").scrollIntoView({
          behavior: reduceMotion.matches ? "instant" : "smooth",
          block: "start"
        });
      });
      pagination.append(button);
    };

    addPageButton("←", Math.max(1, library.page - 1), {
      disabled: library.page === 1,
      label: "Trang trước"
    });
    for (let page = 1; page <= pageCount; page += 1) {
      addPageButton(String(page), page, { current: page === library.page });
    }
    addPageButton("→", Math.min(pageCount, library.page + 1), {
      disabled: library.page === pageCount,
      label: "Trang tiếp theo"
    });
  }

  function renderLibrary() {
    const query = normalizeText(library.query.trim());
    let matches = ideaData.filter((idea) => {
      const matchesCategory = library.category === "all" || idea.category === library.category;
      const searchable = normalizeText(`${idea.quote} ${idea.description} ${categoryNames[idea.category]}`);
      return matchesCategory && (!query || searchable.includes(query));
    });

    if (library.sort === "az") {
      matches = [...matches].sort((first, second) => first.quote.localeCompare(second.quote, "vi"));
    }

    const pageCount = Math.ceil(matches.length / pageSize);
    library.page = Math.max(1, Math.min(library.page, pageCount || 1));
    const start = (library.page - 1) * pageSize;
    const pageItems = matches.slice(start, start + pageSize);
    resultList.querySelectorAll(".reveal-line").forEach((item) => revealObserver?.unobserve(item));
    resultList.replaceChildren(...pageItems.map((idea, index) => createIdeaCard(idea, start + index)));
    observeReveal([...resultList.querySelectorAll(".reveal-line")]);

    emptyState.hidden = matches.length > 0;
    resultList.hidden = matches.length === 0;
    const rangeStart = matches.length ? start + 1 : 0;
    const rangeEnd = Math.min(start + pageSize, matches.length);
    resultStatus.textContent = `Hiển thị ${rangeStart}–${rangeEnd} trong ${matches.length} ý niệm`;
    renderPagination(pageCount);
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      library.category = button.dataset.filter;
      library.page = 1;
      filterButtons.forEach((filter) => {
        const active = filter === button;
        filter.classList.toggle("is-active", active);
        filter.setAttribute("aria-pressed", String(active));
      });
      renderLibrary();
    });
  });

  searchInput.addEventListener("input", () => {
    library.query = searchInput.value;
    library.page = 1;
    renderLibrary();
  });

  sortSelect.addEventListener("change", () => {
    library.sort = sortSelect.value;
    library.page = 1;
    renderLibrary();
  });

  resetSearch.addEventListener("click", () => {
    searchInput.value = "";
    library.query = "";
    library.category = "all";
    library.page = 1;
    filterButtons.forEach((button) => {
      const active = button.dataset.filter === "all";
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderLibrary();
    searchInput.focus();
  });

  document.addEventListener("keydown", (event) => {
    const target = event.target;
    const isTyping = target instanceof HTMLElement &&
      (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
    if (event.key === "/" && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      searchInput.focus();
    }
    if (event.key === "Escape" && target === searchInput && searchInput.value) {
      searchInput.value = "";
      library.query = "";
      library.page = 1;
      renderLibrary();
    }
  });

  renderLibrary();

  // Native smooth scrolling keeps navigation links accessible and predictable.
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: reduceMotion.matches ? "instant" : "smooth",
        block: "start"
      });
      closeMenu();
    });
  });

  function closeMenu() {
    if (!nav || !menuToggle) return;
    nav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  }

  if (nav && menuToggle) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!isOpen));
      nav.classList.toggle("is-open", !isOpen);
      document.body.classList.toggle("menu-open", !isOpen);
    });
  }

  // Touch devices get a brief press state instead of a simulated mouse cursor.
  if (!finePointer.matches) {
    document.querySelectorAll("a, button").forEach((control) => {
      control.addEventListener("pointerdown", () => control.classList.add("touch-feedback"));
      ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
        control.addEventListener(eventName, () => control.classList.remove("touch-feedback"));
      });
    });
  }

  reduceMotion.addEventListener?.("change", (event) => {
    if (event.matches) {
      if (cursorFrame) cancelAnimationFrame(cursorFrame);
      cursorFrame = 0;
      pointer.active = false;
      document.body.classList.remove("cursor-ready");
    } else if (finePointer.matches) {
      document.body.classList.add("cursor-ready");
    }
  });
})();
