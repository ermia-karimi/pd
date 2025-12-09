// // app.js — Snap2Pdf Ultra-Fast + Force-Share + Fit + Compression + Chunked
// let pickedImages = [];
// let pdfSize = "a4";

// // ---------- CONFIG ----------
// const DEFAULT_MAX_DIM = 1500;   // recommended max pixel dimension for longest side
// const DEFAULT_QUALITY = 0.85;   // JPEG quality: 0.5 .. 1
// const CHUNK_SIZE = 20;          // number of images per chunk
// const MIN_TICK = 3;             // ms to yield to UI between images

// // ---------- DOM refs ----------
// const inputEl = document.getElementById("imagePicker");
// const toastEl = document.getElementById("toast");
// const convertBtn = document.getElementById("convertBtn");
// const hh11 = document.getElementById("hh11");
// const sizeButtons = document.getElementById("sizeButtons");

// // ---------- Toast ----------
// function showToast(msg = "", duration = 1800) {
//     if (!toastEl) return;
//     toastEl.innerText = msg;
//     toastEl.classList.add("show");
//     clearTimeout(showToast._t);
//     showToast._t = setTimeout(() => toastEl.classList.remove("show"), duration);
// }
// function setStatus(text = "") {
//     if (!hh11) return;
//     hh11.innerText = text;
// }

// // ---------- File select ----------
// inputEl.addEventListener("change", async (e) => {
//     pickedImages = Array.from(e.target.files || []);
//     setStatus("");
//     showToast(`Selected ${pickedImages.length} photos`);
//     await new Promise(r => setTimeout(r, 40));
// });

// // ---------- Size buttons ----------
// sizeButtons.addEventListener("click", (ev) => {
//     const btn = ev.target.closest(".size-btn");
//     if (!btn) return;
//     document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
//     btn.classList.add("active");
//     pdfSize = btn.dataset.size || "a4";
// });

// // ---------- Helpers ----------
// function fileToDataURL(file) {
//     return new Promise((res, rej) => {
//         const reader = new FileReader();
//         reader.onload = () => res(reader.result);
//         reader.onerror = rej;
//         reader.readAsDataURL(file);
//     });
// }
// function loadImage(src) {
//     return new Promise((res, rej) => {
//         const img = new Image();
//         img.onload = () => res(img);
//         img.onerror = rej;
//         img.crossOrigin = "anonymous";
//         img.src = src;
//     });
// }
// const reuseCanvas = document.createElement("canvas");
// const reuseCtx = reuseCanvas.getContext("2d");
// function compressImageToDataURL(img, maxDim, quality) {
//     let w = img.width;
//     let h = img.height;
//     const ratio = Math.min(maxDim / w, maxDim / h, 1);
//     w = Math.round(w * ratio);
//     h = Math.round(h * ratio);
//     reuseCanvas.width = w;
//     reuseCanvas.height = h;
//     reuseCtx.clearRect(0, 0, w, h);
//     reuseCtx.drawImage(img, 0, 0, w, h);
//     return reuseCanvas.toDataURL("image/jpeg", quality);
// }
// async function processImageFile(file, maxDim, quality) {
//     const dataUrl = await fileToDataURL(file);
//     const img = await loadImage(dataUrl);
//     return compressImageToDataURL(img, maxDim, quality);
// }

// // ---------- Fit page size ----------
// const FIT_MAX_DIM = 2500;
// function calcFitPageSize(imgW, imgH, uiMax) {
//     const maxDim = Math.max(imgW, imgH);
//     const cap = Math.min(FIT_MAX_DIM, uiMax || DEFAULT_MAX_DIM);
//     if (maxDim <= cap) return [imgW, imgH];
//     const scale = cap / maxDim;
//     return [Math.round(imgW * scale), Math.round(imgH * scale)];
// }

// // ---------- Main PDF creation ----------
// convertBtn.addEventListener("click", async () => {
//     try {
//         if (!pickedImages.length) {
//             showToast("Please select photos first", 2000);
//             return;
//         }

//         const maxDimInput = document.getElementById("maxDim");
//         const qualityInput = document.getElementById("quality");
//         const uiMax = maxDimInput ? Math.max(600, Math.min(4000, Number(maxDimInput.value) || DEFAULT_MAX_DIM)) : DEFAULT_MAX_DIM;
//         const uiQuality = qualityInput ? Math.max(0.5, Math.min(1, Number(qualityInput.value) || DEFAULT_QUALITY)) : DEFAULT_QUALITY;

//         setStatus("");
//         showToast("Preparing PDF...");

//         const { jsPDF } = window.jspdf;
//         let pdf;
//         let pageW, pageH;

//         // FIT mode
//         if (pdfSize === "fit") {
//             setStatus("Processing first image for Fit...");
//             const firstCompressed = await processImageFile(pickedImages[0], uiMax, uiQuality);
//             const firstImg = await loadImage(firstCompressed);
//             [pageW, pageH] = calcFitPageSize(firstImg.width, firstImg.height, uiMax);
//             pdf = new jsPDF({ unit: "px", format: [pageW, pageH], compress: true, worker: true });

//             const scale = Math.min(pageW / firstImg.width, pageH / firstImg.height, 1);
//             const w = Math.round(firstImg.width * scale);
//             const h = Math.round(firstImg.height * scale);
//             const x = Math.round((pageW - w) / 2);
//             const y = Math.round((pageH - h) / 2);
//             pdf.addImage(firstCompressed, "JPEG", x, y, w, h, undefined, "FAST");
//         } else {
//             pdf = new jsPDF({ unit: "px", format: pdfSize, compress: true, worker: true });
//             pageW = pdf.internal.pageSize.getWidth();
//             pageH = pdf.internal.pageSize.getHeight();
//         }

//         const total = pickedImages.length;
//         let processed = (pdfSize === "fit") ? 1 : 0;
//         const startIndex = (pdfSize === "fit") ? 1 : 0;

//         for (let s = startIndex; s < total; s += CHUNK_SIZE) {
//             const chunk = pickedImages.slice(s, s + CHUNK_SIZE);
//             for (let i = 0; i < chunk.length; i++) {
//                 const idx = s + i;
//                 setStatus(`Processing ${idx + 1} / ${total}`);
//                 try {
//                     const compressed = await processImageFile(chunk[i], uiMax, uiQuality);
//                     const img = await loadImage(compressed);
//                     const maxW = pageW - 20;
//                     const maxH = pageH - 20;
//                     const scale = Math.min(maxW / img.width, maxH / img.height, 1);
//                     const w = Math.round(img.width * scale);
//                     const h = Math.round(img.height * scale);
//                     const x = Math.round((pageW - w) / 2);
//                     const y = Math.round((pageH - h) / 2);

//                     if (!(pdfSize === "fit" && idx === 0)) pdf.addPage([pageW, pageH]);
//                     pdf.addImage(compressed, "JPEG", x, y, w, h, undefined, "FAST");
//                 } catch (err) {
//                     console.warn("Skipping image due to error:", err);
//                 }

//                 processed++;
//                 const percent = Math.round((processed / total) * 100);
//                 showToast(`Creating PDF... ${percent}%`, 1000);

//                 await new Promise(r => setTimeout(r, MIN_TICK));
//             }
//             await new Promise(r => setTimeout(r, 60));
//         }

//         setStatus("Finalizing PDF...");
//         showToast("Finalizing PDF...", 800);

//         const blob = pdf.output("blob");
//         const pdfFile = new File([blob], "Snap2Pdf_compressed.pdf", { type: "application/pdf" });

//         showToast("PDF is ready!", 1200);
//         setStatus("");

//         // ---------- Force Share ----------
//         try {
//             if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
//                 await navigator.share({ files: [pdfFile], title: "Snap2Pdf", text: "Here is your PDF" });
//             } else {
//                 pdf.save("Snap2Pdf_compressed.pdf");
//             }
//         } catch (e) {
//             console.warn("Share failed, fallback to save", e);
//             pdf.save("Snap2Pdf_compressed.pdf");
//         }

//     } catch (err) {
//         console.error("Unexpected error:", err);
//         showToast("Error occurred. See console.", 2000);
//         setStatus("");
//     }
// });



// // manifest

// if ('serviceWorker' in navigator) {
//     window.addEventListener('load', () => {
//         navigator.serviceWorker.register('service-worker.js')
//             .then(reg => console.log('Service Worker registered:', reg))
//             .catch(err => console.error('Service Worker registration failed:', err));
//     });
// }



















































let pickedImages = [];
let pdfSize = "a4";

const inputEl = document.getElementById("imagePicker");
const convertBtn = document.getElementById("convertBtn");
const hh11 = document.getElementById("hh11");
const toastEl = document.getElementById("toast");

function toast(msg) {
    toastEl.innerText = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 1500);
}
function status(msg) { hh11.innerText = msg; }

// select images
inputEl.addEventListener("change", (e) => {
    pickedImages = Array.from(e.target.files);
    toast(`${pickedImages.length} images selected`);
});

// size buttons
document.getElementById("sizeButtons").addEventListener("click", (e) => {
    const btn = e.target.closest(".size-btn");
    if (!btn) return;

    document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    pdfSize = btn.dataset.size;
});

// MAIN — convert to PDF without Worker (Safari safe)
convertBtn.addEventListener("click", async () => {
    if (!pickedImages.length) {
        toast("Select images first");
        return;
    }

    status("Processing images…");

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        unit: "px",
        format: pdfSize,
        compress: false
    });

    let firstPage = true;

    for (let i = 0; i < pickedImages.length; i++) {

        const file = pickedImages[i];
        const imgURL = await readAsDataURL(file);
        const img = await loadImage(imgURL);

        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();

        let w = img.width;
        let h = img.height;

        // -------- FIT MODE --------
        if (pdfSize === "fit") {
            const scale = Math.min((pageW - 20) / w, (pageH - 20) / h);
            w *= scale;
            h *= scale;
        } else {
            // Default (A4, Letter)
            const scale = Math.min((pageW - 40) / w, (pageH - 40) / h);
            w *= scale;
            h *= scale;
        }

        if (!firstPage) pdf.addPage();
        firstPage = false;

        pdf.addImage(img, "JPEG", (pageW - w) / 2, (pageH - h) / 2, w, h);

        status(`Processing ${i + 1} / ${pickedImages.length}`);
    }

    status("Finalizing PDF…");

    const pdfBlob = pdf.output("blob");
    const filePDF = new File([pdfBlob], "Snap2PDF.pdf", { type: "application/pdf" });

    // -------- SHARE if supported --------
    if (navigator.canShare && navigator.canShare({ files: [filePDF] })) {
        await navigator.share({
            files: [filePDF]
        });
    } else {
        pdf.save("Snap2PDF.pdf");
    }

    toast("PDF ready");
    status("");
});

// helpers
function readAsDataURL(file) {
    return new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
    });
}
function loadImage(src) {
    return new Promise((res) => {
        const img = new Image();
        img.onload = () => res(img);
        img.src = src;
    });
}


