export type Comment = {
  created_at: string;
  name: string;
  comment: string;
  post_path: string;
  token_id: string;
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
