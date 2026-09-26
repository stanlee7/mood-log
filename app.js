document.addEventListener('DOMContentLoaded', () => {

  // 감정 데이터 배열 (mainEmoji 경로, cardBgColor 및 bodyBgColor 포함)
  const emotions = [
    { id: 'happy', label: '행복', mainEmoji: './public/emotions/01_happy_행복.png', bgColor: '#FFF9C4', bodyBgColor: '#FFFDE7' },
    { id: 'calm', label: '평온', mainEmoji: './public/emotions/02_calm_평온.png', bgColor: '#E8F5E9', bodyBgColor: '#F0FDF4' },
    { id: 'normal', label: '보통', mainEmoji: './public/emotions/03_normal_보통.png', bgColor: '#F3F4F6', bodyBgColor: '#F8FAFC' },
    { id: 'sad', label: '우울', mainEmoji: './public/emotions/04_sad_우울.png', bgColor: '#E3F2FD', bodyBgColor: '#EFF6FF' },
    { id: 'angry', label: '화남', mainEmoji: './public/emotions/05_angry_화남.png', bgColor: '#FFEBEE', bodyBgColor: '#FEF2F2' }
  ];

  const emotionButtons = document.querySelectorAll('.emotion-btn');
  const emotionItems = document.querySelectorAll('.emotion-item');
  const emotionDisplayArea = document.getElementById('emotion-display-area');
  const saveBtn = document.getElementById('save-btn');
  const saveHelper = document.getElementById('save-helper');
  const moodNote = document.getElementById('mood-note');
  const charCount = document.getElementById('char-count');
  const historyList = document.getElementById('history-list');

  let selectedEmotion = null;

  // 1) 감정 선택 및 토글 해제 기능
  emotionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const parentItem = button.closest('.emotion-item');
      const isAlreadySelected = button.classList.contains('selected');

      // 기존 선택 상태 모두 해제
      emotionButtons.forEach(btn => btn.classList.remove('selected'));
      emotionItems.forEach(item => item.classList.remove('selected'));

      if (isAlreadySelected) {
        // [토글 해제] 이미 선택된 감정 버튼을 다시 누른 경우
        selectedEmotion = null;
        if (saveBtn) {
          saveBtn.disabled = true;
        }
        if (saveHelper) saveHelper.classList.remove('hidden');

        // 전체 화면 배경색 기본값으로 원복
        document.body.style.backgroundColor = '#f3f4f6';

        // 감정 표시 영역 초기화
        if (emotionDisplayArea) {
          emotionDisplayArea.style.backgroundColor = '#f9fafb';
          emotionDisplayArea.classList.remove('has-emotion');
          emotionDisplayArea.innerHTML = `
            <div class="placeholder-box">
              <p class="placeholder-text-main">아직 고른 감정이 없어요</p>
              <p class="placeholder-text-sub">아래에서 오늘의 기분을 골라주세요</p>
            </div>
          `;
        }
      } else {
        // [신규 선택] 감정을 새로 선택한 경우
        button.classList.add('selected');
        if (parentItem) {
          parentItem.classList.add('selected');
        }

        const emotionId = button.getAttribute('data-emotion');
        selectedEmotion = emotions.find(e => e.id === emotionId);

        if (saveBtn) {
          saveBtn.disabled = false;
        }
        if (saveHelper) saveHelper.classList.add('hidden');

        if (selectedEmotion) {
          // 전체 화면 배경색을 감정 테마에 맞춰 변경
          document.body.style.backgroundColor = selectedEmotion.bodyBgColor;

          // 선택된 감정에 맞는 카드 내부 배경색(bgColor) 적용 및 화면 갱신
          if (emotionDisplayArea) {
            emotionDisplayArea.style.backgroundColor = selectedEmotion.bgColor;
            emotionDisplayArea.classList.add('has-emotion');
            emotionDisplayArea.innerHTML = `
              <div class="selected-emotion-preview">
                <img src="${selectedEmotion.mainEmoji}" alt="${selectedEmotion.label}" />
                <span class="selected-emotion-title">${selectedEmotion.label}</span>
              </div>
            `;
          }
        }
      }
    });
  });

  if (moodNote) {
    // 2) 입력 상자를 눌렀을 때(포커스 시) 키보드에 가려지지 않도록 화면 중앙/상단으로 스크롤
    moodNote.addEventListener('focus', () => {
      setTimeout(() => {
        moodNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    });

    // 3) 글자 수 표시 및 한도 근처 경고
    if (charCount) {
      moodNote.addEventListener('input', () => {
        const currentLength = moodNote.value.length;
        charCount.textContent = `${currentLength} / 60`;

        if (currentLength >= 50) {
          charCount.classList.add('warning');
        } else {
          charCount.classList.remove('warning');
        }
      });
    }
  }

  // ===== 🗄️ Application 탭 -> Local Storage 서랍 저장소 모듈 (DrawerStorage) =====
  const KEYS = {
    LOGS: 'mood_logs',
    DRAWER_INFO: 'mood_drawer_info',
    DRAFT_NOTE: 'mood_draft_note'
  };

  const DrawerStorage = {
    // 1) 감정 기록 가져오기
    getLogs: () => {
      try {
        const raw = localStorage.getItem(KEYS.LOGS);
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        console.error('Failed to parse logs from LocalStorage:', e);
        return [];
      }
    },
    // 2) 신규 감정 기록 저장 및 서랍 메타정보 동기화
    saveLog: (newLog) => {
      const logs = DrawerStorage.getLogs();
      logs.unshift(newLog);
      try {
        localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
        DrawerStorage.updateDrawerInfo(logs);
      } catch (e) {
        console.error('Failed to save log to LocalStorage:', e);
      }
      return logs;
    },
    // 3) 서랍 보관함 정보 메타데이터 업데이트 (총 저장 건수, 감정별 통계, 업데이트 일시)
    updateDrawerInfo: (logs) => {
      const stats = {};
      logs.forEach(log => {
        const label = log.emotion.label;
        stats[label] = (stats[label] || 0) + 1;
      });

      const drawerInfo = {
        totalLogs: logs.length,
        emotionStats: stats,
        lastUpdated: new Date().toLocaleString('ko-KR')
      };

      try {
        localStorage.setItem(KEYS.DRAWER_INFO, JSON.stringify(drawerInfo));
      } catch (e) {
        console.error('Failed to update drawer info:', e);
      }
    },
    // 4) 서랍 속 임시 작성 메모 관리 (Draft)
    saveDraftNote: (note) => {
      try {
        if (note && note.trim().length > 0) {
          localStorage.setItem(KEYS.DRAFT_NOTE, note);
        } else {
          localStorage.removeItem(KEYS.DRAFT_NOTE);
        }
      } catch (e) {}
    },
    getDraftNote: () => {
      return localStorage.getItem(KEYS.DRAFT_NOTE) || '';
    },
    clearDraftNote: () => {
      localStorage.removeItem(KEYS.DRAFT_NOTE);
    }
  };

  // LocalStorage 서랍 데이터 로드
  let savedLogs = DrawerStorage.getLogs();
  DrawerStorage.updateDrawerInfo(savedLogs);

  // 작성 중이던 임시 메모 서랍 복구
  if (moodNote) {
    const savedDraft = DrawerStorage.getDraftNote();
    if (savedDraft) {
      moodNote.value = savedDraft;
      if (charCount) charCount.textContent = `${savedDraft.length} / 60`;
    }
  }

  // 히스토리 목록 렌더링 (최신순)
  const renderHistory = () => {
    if (!historyList) return;

    if (savedLogs.length === 0) {
      historyList.innerHTML = `
        <div class="history-empty">
          <p style="font-weight: 600;">아직 작성된 감정 기록이 없어요.</p>
          <p style="margin-top: 4px; font-size: 0.8rem; color: #b0b8c1;">오늘의 기분을 선택하고 한 줄로 남겨보세요!</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = savedLogs.map(log => `
      <div class="history-item" style="border-left: 4px solid ${log.emotion.bgColor};">
        <div class="history-thumb" style="background-color: ${log.emotion.bgColor};">
          <img src="${log.emotion.mainEmoji}" alt="${log.emotion.label}" />
        </div>
        <div class="history-content">
          <div class="history-header-row">
            <span class="history-emotion-name">${log.emotion.label}</span>
            <span class="history-date">${log.date}</span>
          </div>
          <p class="history-note">${log.note ? escapeHtml(log.note) : '<span style="color: #b0b8c1; font-style: italic;">(작성한 메모가 없습니다)</span>'}</p>
        </div>
      </div>
    `).join('');
  };

  // XSS 방지 이스케이프 함수
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = text;
    return div.innerHTML;
  }

  // 초기 히스토리 렌더링
  renderHistory();

  // 입력 상자 포커스 및 작성 메모 실시간 서랍 저장 (Draft)
  if (moodNote) {
    moodNote.addEventListener('focus', () => {
      setTimeout(() => {
        moodNote.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    });

    moodNote.addEventListener('input', () => {
      const currentLength = moodNote.value.length;
      if (charCount) {
        charCount.textContent = `${currentLength} / 60`;
        if (currentLength >= 50) {
          charCount.classList.add('warning');
        } else {
          charCount.classList.remove('warning');
        }
      }

      // 작성 메모 실시간 서랍 보관 (Local Storage)
      DrawerStorage.saveDraftNote(moodNote.value);
    });
  }

  // 저장 버튼 클릭 시 서랍 저장 처리
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      if (!selectedEmotion) return;

      const now = new Date();
      const month = now.getMonth() + 1;
      const date = now.getDate();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const formattedDate = `${month}월 ${date}일 ${hours}:${minutes}`;

      const newLog = {
        id: Date.now(),
        emotion: selectedEmotion,
        note: moodNote ? moodNote.value.trim() : '',
        date: formattedDate
      };

      // DrawerStorage 모듈을 통해 서랍 속 보관함에 최신순 저장
      savedLogs = DrawerStorage.saveLog(newLog);
      DrawerStorage.clearDraftNote();

      // 입력창 및 감정 선택 초기화
      if (moodNote) moodNote.value = '';
      if (charCount) charCount.textContent = '0 / 60';

      selectedEmotion = null;
      emotionButtons.forEach(btn => btn.classList.remove('selected'));
      emotionItems.forEach(item => item.classList.remove('selected'));

      // 배경 및 표시 영역 초기화
      document.body.style.backgroundColor = '#f3f4f6';
      if (emotionDisplayArea) {
        emotionDisplayArea.style.backgroundColor = '#f9fafb';
        emotionDisplayArea.classList.remove('has-emotion');
        emotionDisplayArea.innerHTML = `
          <div class="placeholder-box">
            <p class="placeholder-text-main">아직 고른 감정이 없어요</p>
            <p class="placeholder-text-sub">아래에서 오늘의 기분을 골라주세요</p>
          </div>
        `;
      }

      saveBtn.disabled = true;
      if (saveHelper) saveHelper.classList.remove('hidden');

      // 히스토리 리스트 갱신
      renderHistory();
    });
  }
});
