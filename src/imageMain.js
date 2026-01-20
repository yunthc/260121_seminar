// src/imageMain.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

import { firebaseConfig } from "./firebaseConfig.js";

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// DOM 요소
const uploadForm = document.getElementById('upload-form');
const submitBtn = document.getElementById('submit-btn');
const loader = document.getElementById('loader');
let currentUser = null;

// 로그인 체크
onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
  } else {
    alert("로그인이 필요한 서비스입니다.");
    window.location.href = "index.html";
  }
});

// 업로드 핸들러
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!currentUser) return;

  // 로딩 표시 및 버튼 비활성화
  loader.style.display = 'block';
  submitBtn.disabled = true;
  submitBtn.innerText = '처리 중...';

  try {
    const formData = new FormData(uploadForm);
    const file = formData.get('imageFile');
    const itemId = formData.get('itemId');
    const grade = formData.get('grade');
    const domain = formData.get('domain');

    // 1. Storage에 이미지 업로드
    // 파일명 중복 방지를 위해 타임스탬프 추가
    const storageRef = ref(storage, `images/${currentUser.uid}/${Date.now()}_${file.name}`);
    
    // 이미지 업로드 실행
    const snapshot = await uploadBytes(storageRef, file);
    
    // 2. 업로드된 이미지의 다운로드 URL 가져오기
    const downloadURL = await getDownloadURL(snapshot.ref);

    // 3. Firestore에 메타데이터 저장
    await addDoc(collection(db, "image_uploads"), {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      itemId: itemId,
      grade: grade,
      domain: domain,
      imageUrl: downloadURL, // Storage URL 저장
      fileName: file.name,
      timestamp: serverTimestamp()
    });

    alert("업로드가 완료되었습니다!");
    uploadForm.reset(); // 폼 초기화

  } catch (error) {
    console.error("Upload Error:", error);
    alert("업로드 중 오류가 발생했습니다: " + error.message);
  } finally {
    // UI 원복
    loader.style.display = 'none';
    submitBtn.disabled = false;
    submitBtn.innerText = '업로드 하기';
  }
});