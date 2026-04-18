const startBtn = document.getElementById('start-btn');
const setupSection = document.getElementById('setup-section');
const quizSection = document.getElementById('quiz-section');
const resultSection = document.getElementById('result-section');

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const abortBtn = document.getElementById('abort-btn');
const restartBtn = document.getElementById('restart-btn');
const newFileBtn = document.getElementById('new-file-btn');

const correctScoreEl = document.getElementById('correct-score');
const totalScoreEl = document.getElementById('total-questions');
const finalScoreEl = document.getElementById('final-score');

let questions = [];
let currentRoundQuestions = [];
let nextRoundQuestions = [];
let currentQuestionIndex = 0;
let correctCount = 0;
let hasAnsweredCurrent = false;

// Hàm trộn mảng ngẫu nhiên (thuật toán Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Đọc file từ thư mục
startBtn.addEventListener('click', () => {
    fetch('cauhoi.txt')
        .then(response => {
            if (!response.ok) {
                throw new Error('Không thể tải file cauhoi.txt');
            }
            return response.text();
        })
        .then(content => {
            parseQuestions(content);
            if (questions.length > 0) {
                startQuiz();
            } else {
                alert("Không tìm thấy câu hỏi hoặc định dạng file không đúng. Hãy kiểm tra lại!");
            }
        })
        .catch(error => {
            alert("Lỗi: " + error.message + "\n\nCHÚ Ý: Trình duyệt không cho phép đọc trực tiếp file từ ổ cứng (file://) vì lý do bảo mật. Vui lòng mở bằng Live Server (VS Code) hoặc qua một local web server.");
        });
});

// Hàm phân tích văn bản thành mảng câu hỏi
function parseQuestions(text) {
    questions = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
    
    let currentQ = null;
    let options = [];
    let correctId = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.match(/^Đáp án/i) || line.match(/^Kết quả/i)) {
            // Dòng chứa đáp án đúng
            const match = line.match(/(A|B|C|D)/i);
            if (match) {
                correctId = match[1].toUpperCase();
            }
            // Lấy số thứ tự câu hỏi gốc để tìm ảnh
            let qNum = null;
            if (currentQ) {
                const matchNumber = currentQ.match(/^Câu (\d+):/i);
                if (matchNumber) {
                    qNum = matchNumber[1];
                }
            }

            // Nếu đã thu thập đủ hỏi, đáp và kết quả thì đẩy vào mảng
            if (currentQ && options.length > 0 && correctId) {
                questions.push({
                    text: currentQ,
                    options: [...options],
                    correct: correctId,
                    originalNumber: qNum
                });
            }
            // Chuẩn bị cho câu tiếp theo
            currentQ = null;
            options = [];
            correctId = null;
        } else if (line.match(/^(A|B|C|D)[\.\)]/i)) {
            // Dòng chứa lựa chọn đáp án (A. hoặc A)) - Xóa đi phần A,B,C,D ở đầu để khi trộn không bị kỳ
            options.push({
                id: line.charAt(0).toUpperCase(),
                text: line.replace(/^(A|B|C|D)[\.\)]\s*/i, '')
            });
        } else {
            // Phần của câu hỏi
            if (!currentQ) {
                currentQ = line;
            } else {
                currentQ += ' ' + line; // Gộp chung nếu hỏi dài thành nhiều dòng
            }
        }
    }
}

// Bắt đầu làm bài trắc nghiệm
function startQuiz() {
    setupSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    
    // Bắt đầu vòng đầu tiên với tất cả câu hỏi
    currentRoundQuestions = [...questions];
    shuffleArray(currentRoundQuestions);
    
    nextRoundQuestions = [];
    currentQuestionIndex = 0;
    correctCount = 0;
    
    totalScoreEl.textContent = questions.length;
    updateScore();
    loadQuestion();
}

function updateScore() {
    correctScoreEl.textContent = correctCount;
}

function loadQuestion() {
    hasAnsweredCurrent = false;
    nextBtn.classList.add('hidden');
    optionsContainer.innerHTML = '';
    
    const q = currentRoundQuestions[currentQuestionIndex];
    // Nếu câu hỏi bắt đầu bằng "Câu X:" thì loại bỏ phần đó đi cho đẹp, hoặc giữ lại tùy ý
    let displayQuestion = q.text;
    if (displayQuestion.match(/^Câu \d+:\s*/i)) {
        displayQuestion = displayQuestion.replace(/^Câu \d+:\s*/i, '');
    }
    questionText.textContent = `Câu ${currentQuestionIndex + 1}: ${displayQuestion}`;

    // Xóa ảnh cũ nếu có
    const oldImg = document.getElementById('question-image');
    if (oldImg) {
        oldImg.remove();
    }

    // Nếu có số thứ tự gốc, thêm ảnh vào với event onerror để ẩn nếu file không tồn tại
    if (q.originalNumber) {
        const img = document.createElement('img');
        img.id = 'question-image';
        img.src = `picture/${q.originalNumber}.png`;
        img.alt = `Hình ảnh Câu ${q.originalNumber}`;
        img.classList.add('question-image');
        
        // Ẩn ảnh nếu không load được (tức là không có ảnh cho câu này)
        img.onerror = function() {
            this.style.display = 'none';
        };
        
        // Chèn ảnh vào giữa câu hỏi và phần đáp án
        questionText.parentNode.insertBefore(img, optionsContainer);
    }

    // Trộn ngẫu nhiên câu trả lời
    shuffleArray(q.options);

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.classList.add('option-btn');
        btn.textContent = opt.text;
        btn.dataset.id = opt.id; // Lưu id vào dataset để kiểm tra đáp án
        
        btn.addEventListener('click', () => {
            if (hasAnsweredCurrent) return;
            selectAnswer(btn, opt.id, q.correct);
        });
        
        optionsContainer.appendChild(btn);
    });
}

function selectAnswer(selectedBtn, selectedId, correctId) {
    hasAnsweredCurrent = true;
    
    // Khóa tất cả các nút để không cho bấm lại
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(btn => btn.disabled = true);

    // Kiểm tra đúng / sai
    if (selectedId === correctId) {
        selectedBtn.classList.add('correct');
        correctCount++;
        updateScore();
    } else {
        selectedBtn.classList.add('incorrect');
        // Đưa câu sai vào mảng để làm lại vòng sau
        nextRoundQuestions.push(currentRoundQuestions[currentQuestionIndex]);
        
        // Nếu chọn sai, tìm và highlight đáp án đúng dựa vào dataset.id
        allBtns.forEach(btn => {
            if (btn.dataset.id === correctId) {
                btn.classList.add('correct');
            }
        });
    }

    // Hiển thị nút qua câu tiếp
    nextBtn.classList.remove('hidden');
    if (currentQuestionIndex === currentRoundQuestions.length - 1) {
        if (nextRoundQuestions.length > 0) {
            nextBtn.textContent = "Làm lại các câu sai";
        } else {
            nextBtn.textContent = "Xem Kết Quả";
        }
    } else {
        nextBtn.textContent = "Câu Tiếp Theo";
    }
}

// Xử lý nút Next
nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < currentRoundQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        // Hết vòng hiện tại
        if (nextRoundQuestions.length > 0) {
            // Chuyển sang vòng tiếp theo với các câu sai
            currentRoundQuestions = [...nextRoundQuestions];
            shuffleArray(currentRoundQuestions);
            nextRoundQuestions = [];
            currentQuestionIndex = 0;
            loadQuestion();
        } else {
            showResults();
        }
    }
});

function showResults() {
    quizSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    finalScoreEl.textContent = `${correctCount} / ${questions.length}`;
}

// Xử lý nút Làm Lại (giữ bộ câu hỏi cũ)
restartBtn.addEventListener('click', () => {
    startQuiz();
});

// Xử lý nút Bỏ bài (Trở về Màn Hình Chính)
abortBtn.addEventListener('click', () => {
    // Hỏi để xác nhận (tuỳ chọn)
    if (confirm("Bạn có chắc chắn muốn bỏ dở bài trắc nghiệm và quay lại màn hình chính không?")) {
        questions = [];
        quizSection.classList.add('hidden');
        setupSection.classList.remove('hidden');
    }
});

// Xử lý nút Trở lại (đổi tên từ Chọn File Khác)
newFileBtn.textContent = 'Trở Lại Màn Hình Chính';
newFileBtn.addEventListener('click', () => {
    questions = [];
    resultSection.classList.add('hidden');
    setupSection.classList.remove('hidden');
});
