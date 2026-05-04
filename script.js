const startBtn = document.getElementById('start-btn');
const resumeBtn = document.getElementById('resume-btn');
const setupSection = document.getElementById('setup-section');
const quizSection = document.getElementById('quiz-section');
const resultSection = document.getElementById('result-section');

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const nextBtnText = document.getElementById('next-btn-text');
const saveProgressBtn = document.getElementById('save-progress-btn');
const abortBtn = document.getElementById('abort-btn');
const restartBtn = document.getElementById('restart-btn');
const newFileBtn = document.getElementById('new-file-btn');

const correctScoreEl = document.getElementById('correct-score');
const totalScoreEl = document.getElementById('total-questions');
const finalScoreEl = document.getElementById('final-score');
const progressBar = document.getElementById('progress-bar');
const headerProgressText = document.getElementById('header-progress-text');
const imageContainer = document.getElementById('image-container');

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
                // Xóa progress cũ nếu có khi bấm Bắt đầu mới
                localStorage.removeItem('quizProgress');
                checkSavedProgress();
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
            const match = line.match(/(A|B|C|D)/i);
            if (match) {
                correctId = match[1].toUpperCase();
            }
            let qNum = null;
            if (currentQ) {
                const matchNumber = currentQ.match(/^Câu (\d+):/i);
                if (matchNumber) {
                    qNum = matchNumber[1];
                }
            }

            if (currentQ && options.length > 0 && correctId) {
                questions.push({
                    text: currentQ,
                    options: [...options],
                    correct: correctId,
                    originalNumber: qNum
                });
            }
            currentQ = null;
            options = [];
            correctId = null;
        } else if (line.match(/^(A|B|C|D)[\.\)]/i)) {
            options.push({
                id: line.charAt(0).toUpperCase(),
                text: line.replace(/^(A|B|C|D)[\.\)]\s*/i, '')
            });
        } else {
            if (!currentQ) {
                currentQ = line;
            } else {
                currentQ += ' ' + line;
            }
        }
    }
}

// Bắt đầu làm bài trắc nghiệm
function startQuiz() {
    setupSection.classList.add('hidden');
    resultSection.classList.add('hidden');
    quizSection.classList.remove('hidden');
    
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
    // Cập nhật header progress text
    const answeredCount = correctCount + nextRoundQuestions.length;
    headerProgressText.textContent = `${currentQuestionIndex + 1} / ${questions.length}`;
    
    // Cập nhật thanh progress
    const progressPercent = ((currentQuestionIndex) / questions.length) * 100;
    progressBar.style.width = `${progressPercent}%`;
}

function loadQuestion() {
    hasAnsweredCurrent = false;
    nextBtn.classList.add('hidden');
    if (saveProgressBtn) saveProgressBtn.classList.remove('hidden');
    
    optionsContainer.innerHTML = '';
    imageContainer.innerHTML = '';
    
    updateScore();
    
    const q = currentRoundQuestions[currentQuestionIndex];
    let displayQuestion = q.text;
    if (displayQuestion.match(/^Câu \d+:\s*/i)) {
        displayQuestion = displayQuestion.replace(/^Câu \d+:\s*/i, '');
    }
    questionText.textContent = displayQuestion;

    if (q.originalNumber) {
        const img = document.createElement('img');
        img.src = `picture/${q.originalNumber}.png`;
        img.alt = `Hình ảnh Câu ${q.originalNumber}`;
        img.classList.add('max-w-full', 'rounded-lg', 'border', 'border-outline-variant', 'shadow-sm');
        
        img.onerror = function() {
            this.style.display = 'none';
        };
        
        imageContainer.appendChild(img);
    }

    shuffleArray(q.options);

    q.options.forEach((opt, index) => {
        // Tái tạo cấu trúc card đáp án bằng Tailwind CSS
        const btn = document.createElement('button');
        btn.className = "group w-full p-4 text-left border border-outline-variant bg-surface-container-lowest rounded-xl hover:border-primary hover:shadow-md transition-all duration-200 flex justify-between items-center option-btn";
        btn.dataset.id = opt.id;
        
        // Mặc định letter là A, B, C, D hiển thị tuần tự theo index trộn
        const letterDisplay = String.fromCharCode(65 + index);
        
        btn.innerHTML = `
            <div class="flex items-center gap-4">
                <span class="option-letter w-8 h-8 flex items-center justify-center rounded-full border border-outline-variant group-hover:border-primary group-hover:text-primary font-semibold text-sm transition-colors duration-200">${letterDisplay}</span>
                <span class="option-text font-body-lg text-body-lg">${opt.text}</span>
            </div>
            <span class="status-icon material-symbols-outlined hidden" style="font-variation-settings: 'FILL' 1;"></span>
        `;
        
        btn.addEventListener('click', () => {
            if (hasAnsweredCurrent) return;
            selectAnswer(btn, opt.id, q.correct);
        });
        
        optionsContainer.appendChild(btn);
    });
}

function selectAnswer(selectedBtn, selectedId, correctId) {
    hasAnsweredCurrent = true;
    if (saveProgressBtn) saveProgressBtn.classList.add('hidden');
    
    // Khóa tất cả
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(btn => btn.disabled = true);

    const isCorrect = selectedId === correctId;
    
    if (isCorrect) {
        correctCount++;
        updateScore();
        // Cập nhật thanh progress ngay lúc trả lời đúng cho có cảm giác real-time
        progressBar.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
    } else {
        nextRoundQuestions.push(currentRoundQuestions[currentQuestionIndex]);
    }

    // Hiệu ứng và đổi CSS cho các đáp án
    allBtns.forEach(btn => {
        const letterSpan = btn.querySelector('.option-letter');
        const textSpan = btn.querySelector('.option-text');
        const iconSpan = btn.querySelector('.status-icon');
        const id = btn.dataset.id;
        
        // Xóa class mặc định
        btn.classList.remove('border-outline-variant', 'bg-surface-container-lowest', 'hover:border-primary', 'hover:shadow-md');
        letterSpan.classList.remove('border', 'border-outline-variant', 'group-hover:border-primary', 'group-hover:text-primary');
        
        if (id === correctId) {
            // Hiển thị đúng
            btn.classList.add('border-2', 'border-primary', 'bg-primary-container/10', 'shadow-sm');
            if (btn === selectedBtn) {
                btn.classList.add('animate-pulse-glow');
            }
            letterSpan.classList.add('bg-primary', 'text-white');
            textSpan.classList.add('font-medium', 'text-on-primary-fixed-variant');
            
            iconSpan.textContent = 'check_circle';
            iconSpan.classList.remove('hidden');
            iconSpan.classList.add('text-primary');
        } else if (btn === selectedBtn && id !== correctId) {
            // Hiển thị chọn sai
            btn.classList.add('border-2', 'border-error', 'bg-error-container/30', 'shadow-sm', 'animate-shake');
            letterSpan.classList.add('bg-error', 'text-white');
            textSpan.classList.add('font-medium', 'text-on-error-container');
            
            iconSpan.textContent = 'cancel';
            iconSpan.classList.remove('hidden');
            iconSpan.classList.add('text-error');
        } else {
            // Câu không được chọn và sai
            btn.classList.add('border-outline-variant', 'bg-surface-container-lowest', 'opacity-50');
            letterSpan.classList.add('border', 'border-outline-variant');
        }
    });

    nextBtn.classList.remove('hidden');
    if (currentQuestionIndex === currentRoundQuestions.length - 1) {
        if (nextRoundQuestions.length > 0) {
            nextBtnText.textContent = "Làm Lại Câu Sai";
        } else {
            nextBtnText.textContent = "Xem Kết Quả";
        }
    } else {
        nextBtnText.textContent = "Tiếp Theo";
    }
}

// Xử lý nút Next
nextBtn.addEventListener('click', () => {
    if (currentQuestionIndex < currentRoundQuestions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        if (nextRoundQuestions.length > 0) {
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
    
    // Cập nhật vòng quay kết quả (100%)
    progressBar.style.width = '100%';
    
    finalScoreEl.textContent = `${correctCount}/${questions.length}`;
    localStorage.removeItem('quizProgress');
    if (typeof checkSavedProgress === 'function') checkSavedProgress();
}

restartBtn.addEventListener('click', () => {
    startQuiz();
});

abortBtn.addEventListener('click', () => {
    if (confirm("Bạn có chắc chắn muốn bỏ dở bài trắc nghiệm và quay lại màn hình chính không?")) {
        questions = [];
        quizSection.classList.add('hidden');
        resultSection.classList.add('hidden');
        setupSection.classList.remove('hidden');
        progressBar.style.width = '0%';
        headerProgressText.textContent = '0 / 0';
    }
});

newFileBtn.addEventListener('click', () => {
    questions = [];
    resultSection.classList.add('hidden');
    setupSection.classList.remove('hidden');
    progressBar.style.width = '0%';
    headerProgressText.textContent = '0 / 0';
});

// Lưu / Tải Tiến Trình
function checkSavedProgress() {
    if (localStorage.getItem('quizProgress')) {
        if (resumeBtn) resumeBtn.classList.remove('hidden');
    } else {
        if (resumeBtn) resumeBtn.classList.add('hidden');
    }
}
if (resumeBtn) checkSavedProgress();

if (saveProgressBtn) {
    saveProgressBtn.addEventListener('click', () => {
        const progress = {
            questions,
            currentRoundQuestions,
            nextRoundQuestions,
            currentQuestionIndex,
            correctCount
        };
        localStorage.setItem('quizProgress', JSON.stringify(progress));
        alert("Đã lưu tiến trình làm bài!");
        checkSavedProgress();
    });
}

if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
        const saved = localStorage.getItem('quizProgress');
        if (saved) {
            try {
                const progress = JSON.parse(saved);
                questions = progress.questions;
                currentRoundQuestions = progress.currentRoundQuestions;
                nextRoundQuestions = progress.nextRoundQuestions;
                currentQuestionIndex = progress.currentQuestionIndex;
                correctCount = progress.correctCount;
                
                setupSection.classList.add('hidden');
                resultSection.classList.add('hidden');
                quizSection.classList.remove('hidden');
                
                totalScoreEl.textContent = questions.length;
                updateScore();
                loadQuestion();
            } catch (e) {
                alert("Lỗi tải tiến trình. Vui lòng bắt đầu lại.");
                localStorage.removeItem('quizProgress');
                checkSavedProgress();
            }
        }
    });
}
