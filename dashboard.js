document.addEventListener('DOMContentLoaded', async () => {
    const listContainer = document.getElementById('story-list');

    try {
        // Đọc danh sách từ cuốn sổ cái
        const response = await fetch('data.json');
        const stories = await response.json();

        // Vẽ từng truyện ra màn hình
        stories.forEach(story => {
            const card = document.createElement('div');
            card.className = 'story-card';
            card.innerHTML = `
                <h2>${story.title}</h2>
                <p>Số tập: ${story.vols.length}</p>
                <br>
                <a href="read.html?id=${story.id}&vol=0" class="read-btn">Đọc Ngay</a>
            `;
            listContainer.appendChild(card);
        });
    } catch (err) {
        listContainer.innerHTML = '<p>Lỗi tải danh sách truyện. Hãy chắc chắn bạn đang chạy bằng Live Server.</p>';
    }
});