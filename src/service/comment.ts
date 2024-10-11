export type Comment = {
  created_at: string;
  name: string;
  comment: string;
  post_path: string;
  token_id: string;
};

export type PurifyComment = {
  created_at: string;
    original_created_at: string;
  name: string;
  comment: string;
  post_path: string;
  isEditable: boolean;
};


// 날짜 변환 함수
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };
  return date.toLocaleString("ko-KR", options);
}

// 서버 시간을 원래 형식으로 되돌리는 함수
export function parseFormattedDate(formattedDateString: string) {
  const date = new Date(formattedDateString);
  return date.toISOString(); // 서버에서 사용하는 표준 ISO 형식으로 반환
}
