// src/analyzeMain.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
// orderBy 추가됨
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let myChart = null;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Analyze Page - User:", user.email);
    await loadSurveyData(user);
    await loadImageData(user);
  } else {
    alert("로그인이 필요합니다.");
    window.location.href = "index.html";
  }
});

// 1. 설문 데이터 불러오기 (평균 차트 + 상세 리스트)
async function loadSurveyData(user) {
  // [중요] userId로 필터링하고, q1 점수로 내림차순(desc) 정렬
  const q = query(
    collection(db, "survey_results"),
    where("userId", "==", user.uid),
    orderBy("q1", "desc") 
  );

  try {
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      document.querySelector('.chart-container').innerHTML = "<p class='no-data'>제출된 설문 데이터가 없습니다.</p>";
      document.getElementById('response-list').innerHTML = "<p class='no-data'>데이터가 없습니다.</p>";
      return;
    }

    // 통계 계산용 변수
    let totalScores = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 };
    let count = 0;
    
    // 리스트 렌더링을 위한 데이터 배열
    const responseList = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // 통계 누적
      totalScores.q1 += data.q1;
      totalScores.q2 += data.q2;
      totalScores.q3 += data.q3;
      totalScores.q4 += data.q4;
      totalScores.q5 += data.q5;
      count++;

      // 리스트용 데이터 수집
      responseList.push(data);
    });

    // A. 차트 그리기 (기존 로직)
    const averages = [
      (totalScores.q1 / count).toFixed(1),
      (totalScores.q2 / count).toFixed(1),
      (totalScores.q3 / count).toFixed(1),
      (totalScores.q4 / count).toFixed(1),
      (totalScores.q5 / count).toFixed(1)
    ];
    renderChart(averages);

    // B. 상세 리스트 그리기 (새로 추가된 로직)
    renderResponseList(responseList);

  } catch (error) {
    console.error("Error loading survey data:", error);
    // [중요] 색인 에러 처리 안내
    if (error.message.includes("requires an index")) {
        alert("데이터 정렬을 위해 Firebase 색인(Index) 설정이 필요합니다.\n\n개발자 도구(F12) -> Console 탭에 있는 파란색 링크를 클릭하여 색인을 생성해주세요.");
    }
  }
}

// 상세 리스트 렌더링 함수
function renderResponseList(dataList) {
  const listContainer = document.getElementById('response-list');
  listContainer.innerHTML = ""; // 초기화

  dataList.forEach((data, index) => {
    // 날짜 포맷팅 (Timestamp -> Date string)
    let dateStr = "날짜 정보 없음";
    if (data.timestamp) {
        const date = data.timestamp.toDate();
        dateStr = date.toLocaleDateString() + " " + date.toLocaleTimeString();
    }

    const card = document.createElement('div');
    card.className = 'response-card';
    card.innerHTML = `
      <div class="response-header">
        <span>#${index + 1}번째 응답</span>
        <span>${dateStr}</span>
      </div>
      <div class="response-detail">
        <div><strong>Q1. 흥미:</strong> <span class="score-badge">${data.q1}점</span> (기준)</div>
        <div>Q2. 자신감: ${data.q2}점 | Q3. 가치: ${data.q3}점</div>
        <div>Q4. 불안감: ${data.q4}점 | Q5. 끈기: ${data.q5}점</div>
      </div>
    `;
    listContainer.appendChild(card);
  });
}

// Chart.js 렌더링 함수 (기존과 동일)
function renderChart(dataValues) {
  const ctx = document.getElementById('surveyChart').getContext('2d');
  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['흥미', '자신감', '가치 인식', '불안감', '끈기'],
      datasets: [{
        label: '나의 평균 점수',
        data: dataValues,
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 5 }
      }
    }
  });
}

// 2. 이미지 데이터 불러오기 (기존과 동일)
async function loadImageData(user) {
  const gallery = document.getElementById('image-gallery');
  const q = query(collection(db, "image_uploads"), where("userId", "==", user.uid));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    gallery.innerHTML = "<p class='no-data' style='grid-column: 1/-1;'>업로드된 이미지가 없습니다.</p>";
    return;
  }
  gallery.innerHTML = "";

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const itemDiv = document.createElement('div');
    itemDiv.className = 'album-item';
    itemDiv.innerHTML = `
      <a href="${data.imageUrl}" target="_blank">
        <img src="${data.imageUrl}" alt="${data.itemId}" class="album-img">
      </a>
      <div class="album-info">
        <strong>${data.itemId}</strong>
        <span>${data.grade} | ${data.domain}</span>
      </div>
    `;
    gallery.appendChild(itemDiv);
  });
}