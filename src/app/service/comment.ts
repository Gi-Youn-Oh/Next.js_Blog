export type Comment = {
  created_at: string;
  name: string;
  comment: string;
  post_path: string;
  token_id: string;
};

export type PurifyComment = {
  created_at: string;
  name: string;
  comment: string;
  post_path: string;
  isEditable: boolean;
};


// 날짜 변환 함수
export function formatDate(dateString: string) {
  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-indexed, so add 1
  const day = date.getDate();

  let hours = date.getHours();
  const minutes = date.getMinutes();
  const isPM = hours >= 12;
  const ampm = isPM ? '오후' : '오전';

  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'

  const formattedDate = `${year}년 ${month}월 ${day}일 ${ampm} ${hours}:${minutes.toString().padStart(2, '0')}`;
  return formattedDate;
}