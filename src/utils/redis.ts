import { Comment } from "@/service/comment"
import { Redis } from "@upstash/redis"

// Redis 클라이언트 설정
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Redis 연결 상태 확인 함수
export async function checkRedisConnection(): Promise<boolean> {
  try {
    await redis.ping()
    return true
  } catch (error) {
    console.error('Redis 연결 실패:', error)
    return false
  }
}

// IP 주소 추출 헬퍼 함수
export function getClientIP(request: Request): string {
  // Vercel, Cloudflare 등에서 제공하는 헤더들 확인
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    // x-forwarded-for는 여러 IP가 있을 수 있음 (클라이언트, 프록시들)
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) return realIP
  if (cfConnectingIP) return cfConnectingIP
  
  // 기본값 (로컬 개발 시)
  return '127.0.0.1'
}

// 댓글 관련 Redis 키 생성 헬퍼 함수들
export const RedisKeys = {
  // 특정 포스트의 댓글 목록
  postComments: (postPath: string) => `comments:${postPath}`,
  // 사용자별 댓글 작성 제한
  userRateLimit: (userId: string, postPath: string) => `rate_limit:user:${userId}:${postPath}`,
  // IP별 댓글 작성 제한
  ipRateLimit: (ip: string, postPath: string) => `rate_limit:ip:${ip}:${postPath}`,
  // 전체 댓글 캐시
  allComments: 'comments:all',
  // 댓글 통계
  commentStats: (postPath: string) => `stats:comments:${postPath}`,
} as const

// Rate Limiting 관련 함수들
export async function checkRateLimit(
  userId: string, 
  postPath: string, 
  maxRequests: number = 5, 
  windowSeconds: number = 300 // 5분
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = RedisKeys.userRateLimit(userId, postPath)
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, windowSeconds)
  }
  
  const ttl = await redis.ttl(key)
  const resetTime = Date.now() + (ttl * 1000)
  
  return {
    allowed: current <= maxRequests,
    remaining: Math.max(0, maxRequests - current),
    resetTime
  }
}

// IP별 Rate Limiting 함수
export async function checkIPRateLimit(
  ip: string,
  postPath: string,
  maxRequests: number = 10, // IP는 더 관대하게 설정
  windowSeconds: number = 300 // 5분
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = RedisKeys.ipRateLimit(ip, postPath)
  const current = await redis.incr(key)
  
  if (current === 1) {
    await redis.expire(key, windowSeconds)
  }
  
  const ttl = await redis.ttl(key)
  const resetTime = Date.now() + (ttl * 1000)
  
  return {
    allowed: current <= maxRequests,
    remaining: Math.max(0, maxRequests - current),
    resetTime
  }
}

// 통합 Rate Limiting 체크 (사용자 ID + IP 모두 체크)
export async function checkBothRateLimits(
  userId: string,
  ip: string,
  postPath: string,
  userMaxRequests: number = 5,
  ipMaxRequests: number = 10,
  windowSeconds: number = 300
): Promise<{
  allowed: boolean;
  reason?: 'user_limit' | 'ip_limit';
  userLimit: { allowed: boolean; remaining: number; resetTime: number };
  ipLimit: { allowed: boolean; remaining: number; resetTime: number };
}> {
  const [userLimit, ipLimit] = await Promise.all([
    checkRateLimit(userId, postPath, userMaxRequests, windowSeconds),
    checkIPRateLimit(ip, postPath, ipMaxRequests, windowSeconds)
  ])

  const allowed = userLimit.allowed && ipLimit.allowed
  const reason = !allowed ? (!userLimit.allowed ? 'user_limit' : 'ip_limit') : undefined

  console.log(userLimit, ipLimit,'====')
  if(!allowed) {
    console.log('Rate Limit Exceeded', reason)
  }
  return {
    allowed,
    reason,
    userLimit,
    ipLimit
  }
}

// 댓글 캐시 관련 함수들
export async function getCachedComments(postPath: string) {
  try {
    const cached = await redis.get(RedisKeys.postComments(postPath))
    
    // Upstash Redis는 자동으로 JSON을 파싱하므로 추가 파싱 불필요
    if (cached && typeof cached === 'string') {
      return JSON.parse(cached)
    }
    
    // 이미 객체인 경우 그대로 반환
    return cached || null
  } catch (error) {
    console.error('Redis에서 댓글 캐시 조회 실패:', error)
    return null
  }
}

export async function setCachedComments(postPath: string, comments: Comment[], ttlSeconds: number = 300) {
  try {
    // comments가 유효한 배열인지 확인
    if (!Array.isArray(comments)) {
      console.warn('댓글 데이터가 배열이 아닙니다:', comments)
      return
    }
    
    await redis.setex(RedisKeys.postComments(postPath), ttlSeconds, JSON.stringify(comments))
    console.log(`Redis에 댓글 캐시 저장 완료: ${postPath} (${comments.length}개 댓글)`)
  } catch (error) {
    console.error('Redis에 댓글 캐시 저장 실패:', error)
  }
}

export async function invalidateCommentCache(postPath: string) {
  try {
    await redis.del(RedisKeys.postComments(postPath))
    await redis.del(RedisKeys.commentStats(postPath))
  } catch (error) {
    console.error('Redis 댓글 캐시 무효화 실패:', error)
  }
}

// 댓글 통계 업데이트
export async function updateCommentStats(postPath: string, increment: number = 1) {
  try {
    const statsKey = RedisKeys.commentStats(postPath)
    await redis.incrby(statsKey, increment)
    await redis.expire(statsKey, 86400) // 24시간
  } catch (error) {
    console.error('댓글 통계 업데이트 실패:', error)
  }
}