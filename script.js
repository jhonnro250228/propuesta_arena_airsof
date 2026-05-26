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
    // Usamos quickSetter para máximo rendimiento (evita parsear strings de transform)
    const xSet = gsap.quickSetter(cursor, "x", "px");
    const ySet = gsap.quickSetter(cursor, "y", "px");

    document.addEventListener('mousemove', (e) => {
        xSet(e.clientX - 20);
        ySet(e.clientY - 20);
        
        // Simular coordenadas geográficas cambiantes
        const lat = (e.clientX / window.innerWidth * 10).toFixed(3);
        const long = (e.clientY / window.innerHeight * 10).toFixed(3);
        coords.innerText = `${lat}°N, ${long}°E`;
    });

    // Efecto de click técnico
    document.addEventListener('mousedown', () => {
        gsap.to(cursor, { scale: 0.8, duration: 0.1, overwrite: true });
        cursor.style.filter = 'hue-rotate(90deg)';
    });

    document.addEventListener('mouseup', () => {
        gsap.to(cursor, { scale: 1, duration: 0.1, overwrite: true });
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
    const canvasBottom = document.getElementById("bottom-sequence");
    const context = canvas.getContext("2d");
    const contextBottom = canvasBottom.getContext("2d");

    const frameCount = 368; // Total de frames de frame_0001 a frame_0368
    const splitPoint = Math.floor(frameCount / 2); // Punto medio para dividir
    
    const currentFrame = (index) => `./frames_piloto/frame_${(index + 1).toString().padStart(4, '0')}.webp`;

    const images = [];
    const airsoft = { frame: 0 }; 
    const airsoftBottom = { frame: splitPoint }; 

    // Establecer el tamaño del canvas
    const setCanvasSize = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        if(canvasBottom) {
            canvasBottom.width = window.innerWidth * dpr;
            canvasBottom.height = window.innerHeight * dpr;
        }
        
        // Redibujar el frame actual si ya hay imágenes cargadas
        if (images.length > 0 && airsoft.frame < images.length) {
            render(canvas, context, airsoft.frame);
        }
        if (images.length > splitPoint && canvasBottom) {
            render(canvasBottom, contextBottom, airsoftBottom.frame);
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
            loaderText.innerText = `LOADING... ${Math.floor(loadStatus.percent)}%`;
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
            if(canvasBottom && images[splitPoint]) {
                contextBottom.drawImage(images[splitPoint], 0, 0, canvasBottom.width, canvasBottom.height);
            }
        }

        // Animación Primera Mitad (Hero)
        gsap.to(airsoft, {
            frame: splitPoint - 1,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                trigger: ".hero",
                pin: true,
                scrub: 0.5,
                start: "top top",
                end: "+=200%",
                onUpdate: () => render(canvas, context, airsoft.frame),
            },
        });

        // Animación Segunda Mitad (Bottom)
        gsap.to(airsoftBottom, {
            frame: frameCount - 1,
            snap: "frame",
            ease: "none",
            scrollTrigger: {
                trigger: ".immersion-bottom",
                start: "top bottom", // Empieza a animar en cuanto entra a la vista
                end: "bottom top",    // Termina cuando sale de la vista
                scrub: 1,            // Un poco más de suavizado para la integración
                onUpdate: () => render(canvasBottom, contextBottom, airsoftBottom.frame),
            },
        });

        // 4. Scroll Reveal para Equipos (Inicializado después de cargar imágenes)
        ScrollTrigger.batch(".card-reveal", {
            onEnter: elements => gsap.to(elements, {
                opacity: 1,
                y: 0,
                scale: 1,
                stagger: 0.15, 
                duration: 1.2,
                ease: "power2.out",
                overwrite: true
            }),
            start: "top 90%", // Se activa un poco más tarde para una entrada más natural
            once: true        // Solo se anima la primera vez que aparece
        });

    });

    // Función para dibujar el frame actual en el canvas
    function render(targetCanvas, targetContext, frameIndex) {
        if (images[frameIndex]) {
            const img = images[frameIndex];
            
            const canvasAspect = targetCanvas.width / targetCanvas.height;
            const imgAspect = img.width / img.height;
            let drawWidth, drawHeight, offsetX, offsetY;

            if (canvasAspect > imgAspect) {
                drawWidth = targetCanvas.width;
                drawHeight = targetCanvas.width / imgAspect;
                offsetX = 0;
                offsetY = (targetCanvas.height - drawHeight) / 2;
            } else {
                drawWidth = targetCanvas.height * imgAspect;
                drawHeight = targetCanvas.height;
                offsetX = (targetCanvas.width - drawWidth) / 2;
                offsetY = 0;
            }

            targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
            targetContext.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        }
    }

    function hidePreloader() {
        // Pequeño retraso para un efecto visual más suave.
        setTimeout(() => {
            preloader.classList.add('hidden');
            preloader.addEventListener('transitionend', () => {
                ScrollTrigger.refresh(); // REFRESCAR GSAP: Vital para recalcular posiciones tras quitar el loader
                preloader.remove(); // Eliminar el preloader del DOM después de la transición
            });
        }, 500);
    }

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
