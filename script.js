document.addEventListener('DOMContentLoaded', () => {
    // Registrar el plugin ScrollTrigger e inicializar Lenis para scroll suave
    gsap.registerPlugin(ScrollTrigger);
    
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });
    lenis.on('scroll', ScrollTrigger.update);
    
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    
    gsap.ticker.lagSmoothing(0);

    const cursor = document.getElementById('cursor');
    const coords = cursor.querySelector('.cursor-coords');
    const glitchText = document.querySelector('.glitch-text');
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_";
    
    const preloader = document.getElementById('preloader');
    const loaderBar = document.querySelector('.loader-bar');
    const loaderText = document.querySelector('.loader-text');

    // 1. Cursor Táctico Personalizado
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX;
        const y = e.clientY;
        
        cursor.style.transform = `translate(${x - 20}px, ${y - 20}px)`;
        
        // Simular coordenadas geográficas cambiantes
        const lat = (x / window.innerWidth * 10).toFixed(3);
        const long = (y / window.innerHeight * 10).toFixed(3);
        coords.innerText = `${lat}°N, ${long}°E`;
    });

    // Efecto de click técnico
    document.addEventListener('mousedown', () => {
        cursor.style.transform += ' scale(0.8)';
        cursor.style.filter = 'hue-rotate(90deg)';
    });

    document.addEventListener('mouseup', () => {
        cursor.style.transform = cursor.style.transform.replace(' scale(0.8)', '');
        cursor.style.filter = 'none';
    });

    // 2. Animación de Texto Hacker (Scramble)
    const scramble = (element) => {
        let iteration = 0;
        const originalValue = element.dataset.value;
        clearInterval(element.interval);

        element.interval = setInterval(() => {
            element.innerText = originalValue
                .split("")
                .map((letter, index) => {
                    if (index < iteration) {
                        return originalValue[index];
                    }
                    return letters[Math.floor(Math.random() * 36)];
                })
                .join("");

            if (iteration >= originalValue.length) {
                clearInterval(element.interval);
            }
            iteration += 1 / 3;
        }, 30);
    };

    // Ejecutar al cargar
    scramble(glitchText);

    // 3. Secuencia de Frames Inmersiva con Canvas, GSAP y ScrollTrigger
    const canvas = document.getElementById("hero-sequence");
    const context = canvas.getContext("2d");

    const frameCount = 368; // Total de frames de frame_0001 a frame_0368
    const currentFrame = (index) => `./frames_piloto/frame_${(index + 1).toString().padStart(4, '0')}.webp`;

    const images = [];
    const airsoft = {
        frame: 0
    }; 

    // Establecer el tamaño del canvas
    const setCanvasSize = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        // Redibujar el frame actual si ya hay imágenes cargadas
        if (images.length > 0 && airsoft.frame < images.length) {
            render();
        }
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    let imagesLoadedCount = 0;
    const totalCanvasImages = frameCount; // Total de imágenes para la secuencia del canvas
    const imageLoadPromises = []; // Array para almacenar las promesas de carga de imágenes

    // Precargar todas las imágenes y crear promesas
    for (let i = 0; i < frameCount; i++) {
        const img = new Image();
        img.src = currentFrame(i);
        images.push(img);

        const imgLoadPromise = new Promise((resolve) => {
            img.onload = () => {
                imagesLoadedCount++;
                resolve();
            };
            img.onerror = () => {
                imagesLoadedCount++; // Contar incluso si falla para que la barra progrese
                console.error(`Failed to load image: ${img.src}`);
                resolve(); // Resolver incluso en error para no bloquear el preloader
            };
        });
        imageLoadPromises.push(imgLoadPromise);
    }

    // Animación de la barra de carga forzada a 2 segundos
    const loadStatus = { percent: 0 };
    const visualLoadProgress = gsap.to(loadStatus, {
        percent: 100,
        duration: 2,
        ease: "power1.inOut",
        onUpdate: () => {
            loaderBar.style.width = `${loadStatus.percent}%`;
            loaderText.innerText = `CARGANDO... ${Math.floor(loadStatus.percent)}%`;
        }
    });

    // Esperar tanto a las imágenes como a la animación de 3 segundos
    Promise.all([...imageLoadPromises, visualLoadProgress]).then(() => {
        // Una vez que todas las imágenes del canvas están cargadas,
        // esperamos a que el resto de los recursos de la página estén listos.
        if (document.readyState === 'complete') {
            hidePreloader();
        } else {
            window.addEventListener('load', hidePreloader);
        }

        // Inicializar la animación GSAP *después* de que todas las imágenes estén cargadas
        if (images.length > 0) { // Asegurarse de que haya al menos una imagen
            context.drawImage(images[0], 0, 0, canvas.width, canvas.height);
        }

        gsap.to(airsoft, {
            frame: frameCount - 1,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                pin: true,
                scrub: 0.5, // Suaviza la transición entre frames
                start: "top top",
                end: "+=300%", // La animación durará 3 veces la altura del hero
                onUpdate: render,
            },
        });
    });

    // Función para dibujar el frame actual en el canvas
    function render() {
        if (images[airsoft.frame]) {
            const img = images[airsoft.frame];
            
            // Lógica para emular object-fit: cover en Canvas
            const canvasAspect = canvas.width / canvas.height;
            const imgAspect = img.width / img.height;
            let drawWidth, drawHeight, offsetX, offsetY;

            if (canvasAspect > imgAspect) {
                drawWidth = canvas.width;
                drawHeight = canvas.width / imgAspect;
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            } else {
                drawWidth = canvas.height * imgAspect;
                drawHeight = canvas.height;
                offsetX = (canvas.width - drawWidth) / 2;
                offsetY = 0;
            }

            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }
    }

    function hidePreloader() {
        // Pequeño retraso para un efecto visual más suave
        setTimeout(() => {
            preloader.classList.add('hidden');
            preloader.addEventListener('transitionend', () => {
                preloader.remove(); // Eliminar el preloader del DOM después de la transición
            });
        }, 500);
    }
    
    // 4. Scroll Reveal Ultra-Suave (para el resto del contenido)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const cardRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                if (entry.target.classList.contains('glitch-text')) scramble(entry.target);
                cardRevealObserver.unobserve(entry.target); // Dejar de observar una vez revelado
            }
        });
    }, observerOptions);

    document.querySelectorAll('.card-reveal').forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(20px)";
        el.style.transition = "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
        cardRevealObserver.observe(el);
    });

    // 5. Navegación entre Hojas Independientes (Routing SPA)
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-menu a, .logo');
    const views = document.querySelectorAll('.view');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href').replace('#', '');
            const targetView = document.getElementById(`view-${targetId}`);

            if (targetView) {
                e.preventDefault();
                
                // Cambiar estado visual de las vistas
                views.forEach(v => v.classList.remove('active'));
                targetView.classList.add('active');

                // Resetear scroll y refrescar motores de animación
                lenis.scrollTo(0, { immediate: true });
                ScrollTrigger.refresh();
                
                if (window.innerWidth <= 768) navMenu.style.display = 'none';
            }
        });
    });

    navToggle.addEventListener('click', () => {
        navMenu.style.display = navMenu.style.display === 'flex' ? 'none' : 'flex';
        navToggle.innerText = navMenu.style.display === 'flex' ? 'CLOSE // SYSTEM' : 'MENU // OPS_RECON';
    });
});
