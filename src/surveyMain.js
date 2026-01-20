// src/surveyMain.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

import { firebaseConfig } from "./firebaseConfig.js";

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const surveyForm = document.getElementById('survey-form');
let currentUser = null;

// 로그인 상태 확인 (로그인 안 된 경우 메인으로 튕겨냄)
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("Current User:", user.email);
  } else {
    alert("로그인이 필요한 서비스입니다.");
    window.location.href = "index.html";
  }
});

// 폼 제출 핸들러
surveyForm.addEventListener('submit', async (e) => {
  e.preventDefault(); // 페이지 새로고침 방지

  if (!currentUser) {
    alert("사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.");
    return;
  }

  // 폼 데이터 가져오기
  const formData = new FormData(surveyForm);
  const surveyData = {
    userId: currentUser.uid,
    userEmail: currentUser.email, // 분석 시 식별용
    q1: parseInt(formData.get('q1')), // 흥미
    q2: parseInt(formData.get('q2')), // 자신감
    q3: parseInt(formData.get('q3')), // 가치
    q4: parseInt(formData.get('q4')), // 불안
    q5: parseInt(formData.get('q5')), // 끈기
    timestamp: serverTimestamp() // 서버 시간 저장
  };

  try {
    // Firestore 'survey_results' 컬렉션에 저장
    const docRef = await addDoc(collection(db, "survey_results"), surveyData);
    console.log("Document written with ID: ", docRef.id);
    
    alert("설문이 성공적으로 제출되었습니다!");
    window.location.href = "index.html"; // 제출 후 메인으로 이동
  } catch (error) {
    console.error("Error adding document: ", error);
    alert("제출 중 오류가 발생했습니다: " + error.message);
  }
});