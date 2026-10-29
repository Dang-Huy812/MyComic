// Lấy ID truyện và số Vol từ thanh địa chỉ URL
const urlParams = new URLSearchParams(window.location.search);
const storyId = urlParams.get('id');
let currentVolIndex = parseInt(urlParams.get('vol')) || 0;

let pdfDoc = null;
let currentChunkStart = 1;
const PAGES_PER_LOAD = 20;
let storyData = null;

const container = document.getElementById('pdf-container');
const prevChunkBtn = document.getElementById('prev-chunk-btn');
const nextChunkBtn = document.getElementById('next-chunk-btn');
const chunkControls = document.getElementById('chunk-controls');
const pageInput = document.getElementById('page-input');

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// BƯỚC 1: Lấy thông tin truyện từ data.json
async function init() {
    if (!storyId) return alert('Không tìm thấy ID truyện!');
    
    const response = await fetch('data.json');
    const data = await response.json();
    storyData = data.find(s => s.id === storyId);

    if (!storyData) {
        container.innerHTML = '<h3 style="color:white; margin-top:20px;">Không tìm thấy truyện trong dữ liệu</h3>';
        return;
    }

    loadPDF();
}

// BƯỚC 2: Tải file PDF của Vol hiện tại
function loadPDF() {
    // Ráp đường dẫn: ./content/<Tên thư mục>/<Tên Vol>
    const pdfUrl = `./content/${storyData.folder}/${storyData.vols[currentVolIndex]}`;
    
    pdfjsLib.getDocument(pdfUrl).promise.then(pdf => {
        pdfDoc = pdf;
        pageInput.setAttribute('max', pdf.numPages);
        chunkControls.style.display = 'flex';
        
        // Đổi tiêu đề web cho xịn
        document.title = `${storyData.title} - Tập ${currentVolIndex + 1}`;
        
        loadChunk(1);
    }).catch(err => {
        console.error("Lỗi:", err);
        container.innerHTML = '<h3 style="color:white; margin-top:20px;">Lỗi tải file PDF. Kiểm tra lại đường dẫn!</h3>';
    });
}

// BƯỚC 3: Logic tải cụm trang (đã cập nhật)
async function loadChunk(startPage) {
    if (!pdfDoc) return;
    container.innerHTML = '';
    
    prevChunkBtn.disabled = true;
    nextChunkBtn.disabled = true;
    nextChunkBtn.textContent = 'Đang tải...';

    let endPage = Math.min(startPage + PAGES_PER_LOAD - 1, pdfDoc.numPages);

    for (let i = startPage; i <= endPage; i++) {
        await renderPage(i);
    }

    currentChunkStart = startPage;
    prevChunkBtn.disabled = (currentChunkStart === 1);
    
    // Logic tự động nhảy Vol nằm ở đây
    if (endPage >= pdfDoc.numPages) {
        // Nếu đã đọc hết trang cuối của Vol hiện tại
        if (currentVolIndex < storyData.vols.length - 1) {
            // Nếu vẫn còn Vol tiếp theo
            nextChunkBtn.disabled = false;
            nextChunkBtn.textContent = 'Tập Tiếp Theo ➡️';
            nextChunkBtn.style.backgroundColor = '#28a745'; // Đổi màu xanh lá cho dễ nhận diện
        } else {
            // Đã hết toàn bộ các Vol
            nextChunkBtn.disabled = true;
            nextChunkBtn.textContent = 'Đã hết truyện';
            nextChunkBtn.style.backgroundColor = '#555';
        }
    } else {
        // Vẫn đang ở giữa của Vol hiện tại
        nextChunkBtn.disabled = false;
        nextChunkBtn.textContent = '20 Trang tiếp ➡️';
        nextChunkBtn.style.backgroundColor = '#007bff';
    }
}

// Hàm render ảnh PDF (Giữ nguyên)
async function renderPage(pageNum) {
    const page = await pdfDoc.getPage(pageNum);
    const canvas = document.createElement('canvas');
    canvas.className = 'pdf-page';
    canvas.id = 'page-' + pageNum; 
    const ctx = canvas.getContext('2d');
    
    const containerWidth = container.clientWidth || window.innerWidth;
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = containerWidth / unscaledViewport.width;
    
    const viewport = page.getViewport({ scale: scale });
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    container.appendChild(canvas);
    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
}

// NÚT CHUYỂN TRANG/CHUYỂN VOL
nextChunkBtn.addEventListener('click', async () => {
    let nextStart = currentChunkStart + PAGES_PER_LOAD;
    
    if (nextStart <= pdfDoc.numPages) {
        // Tải 20 trang tiếp theo của Vol này
        await loadChunk(nextStart);
        window.scrollTo(0, 0);
    } else {
        // Nhảy sang Vol tiếp theo
        if (currentVolIndex < storyData.vols.length - 1) {
            window.location.href = `read.html?id=${storyId}&vol=${currentVolIndex + 1}`;
        }
    }
});

prevChunkBtn.addEventListener('click', async () => {
    let prevStart = currentChunkStart - PAGES_PER_LOAD;
    if (prevStart >= 1) {
        await loadChunk(prevStart);
        window.scrollTo(0, 0);
    }
});

// Nút Lên Đầu / Xuống Cuối
document.getElementById('btn-top').addEventListener('click', () => window.scrollTo(0, 0));
document.getElementById('btn-bottom').addEventListener('click', () => window.scrollTo(0, document.body.scrollHeight));

// Nhảy trang bất kỳ
document.getElementById('btn-jump').addEventListener('click', async () => {
    const targetPage = parseInt(pageInput.value);
    if (isNaN(targetPage) || targetPage < 1 || targetPage > pdfDoc.numPages) {
        alert(`Vui lòng nhập trang từ 1 đến ${pdfDoc.numPages}`); return;
    }
    const chunkStartPage = Math.floor((targetPage - 1) / PAGES_PER_LOAD) * PAGES_PER_LOAD + 1;
    await loadChunk(chunkStartPage);
    const targetCanvas = document.getElementById('page-' + targetPage);
    if (targetCanvas) targetCanvas.scrollIntoView();
});

// KHỞI ĐỘNG CHƯƠNG TRÌNH
init();