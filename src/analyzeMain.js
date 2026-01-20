// src/analyzeMain.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { firebaseConfig } from "./firebaseConfig.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 차트 인스턴스 변수
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

// 1. 설문 데이터 불러오기 및 차트 그리기
async function loadSurveyData(user) {
  const q = query(
    collection(db, "survey_results"),
    where("userId", "==", user.uid)
  );

  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    document.querySelector('.chart-container').innerHTML = "<p class='no-data'>제출된 설문 데이터가 없습니다.</p>";
    return;
  }

  // 평균 점수 계산을 위한 변수
  let totalScores = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 };
  let count = 0;

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    totalScores.q1 += data.q1;
    totalScores.q2 += data.q2;
    totalScores.q3 += data.q3;
    totalScores.q4 += data.q4;
    totalScores.q5 += data.q5;
    count++;
  });

  // 평균 계산
  const averages = [
    (totalScores.q1 / count).toFixed(1),
    (totalScores.q2 / count).toFixed(1),
    (totalScores.q3 / count).toFixed(1),
    (totalScores.q4 / count).toFixed(1),
    (totalScores.q5 / count).toFixed(1)
  ];

  renderChart(averages);
}

// Chart.js 렌더링 함수
function renderChart(dataValues) {
  const ctx = document.getElementById('surveyChart').getContext('2d');
  
  // 기존 차트가 있다면 파괴 (중복 렌더링 방지)
  if (myChart) myChart.destroy();

  myChart = new Chart(ctx, {
    type: 'bar', // 'radar'로 바꾸면 방사형 차트가 됩니다.
    data: {
      labels: ['흥미', '자신감', '가치 인식', '불안감', '끈기'],
      datasets: [{
        label: '나의 평균 점수 (5점 만점)',
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
        y: {
          beginAtZero: true,
          max: 5 // 5점 만점이므로 최대값 고정
        }
      }
    }
  });
}

// 2. 이미지 데이터 불러오기 및 앨범 생성
async function loadImageData(user) {
  const gallery = document.getElementById('image-gallery');
  
  // 날짜 역순(최신순) 정렬이 필요하다면 복합 색인 설정이 필요할 수 있음
  // 여기서는 단순히 필터링만 수행
  const q = query(
    collection(db, "image_uploads"),
    where("userId", "==", user.uid)
  );

  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    gallery.innerHTML = "<p class='no-data' style='grid-column: 1/-1;'>업로드된 이미지가 없습니다.</p>";
    return;
  }

  gallery.innerHTML = ""; // 로딩 텍스트 제거

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    
    // HTML 요소 생성
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