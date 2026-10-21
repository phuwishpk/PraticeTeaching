import { useState } from 'react';
import { StepForward, AlertTriangle } from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { answerProgress } from '../../shared/roomState';

export default function SkipQuestionButton({ votes = {}, label = 'ข้ามกิจกรรม (Skip)' }) {
  const { roomState, skipQuestion } = useRoom();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const { answered, total } = answerProgress(roomState, votes);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await skipQuestion();
      setShowModal(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="skip-activity-btn"
        onClick={() => setShowModal(true)}
        title="ข้ามกิจกรรมทันทีโดยไม่ต้องรอนักเรียน"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 14px',
          borderRadius: '10px',
          background: 'rgba(255, 184, 108, 0.12)',
          border: '1.5px solid rgba(255, 184, 108, 0.45)',
          color: '#ffb86c',
          fontSize: '0.9rem',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          flexShrink: 0
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255, 184, 108, 0.25)';
          e.currentTarget.style.borderColor = '#ffb86c';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255, 184, 108, 0.12)';
          e.currentTarget.style.borderColor = 'rgba(255, 184, 108, 0.45)';
          e.currentTarget.style.transform = 'none';
        }}
      >
        <StepForward size={16} />
        <span>{label}</span>
      </button>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="skip-dialog-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '1rem',
          }}
          onClick={e => {
            if (e.target === e.currentTarget && !loading) setShowModal(false);
          }}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '440px',
              background: '#161b2e',
              border: '2px solid rgba(255, 184, 108, 0.5)',
              borderRadius: '20px',
              padding: '2rem 1.75rem',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 184, 108, 0.2)',
              textAlign: 'center',
              color: '#f8f8f2',
            }}
          >
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                background: 'rgba(255, 184, 108, 0.15)',
                border: '2px solid rgba(255, 184, 108, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                color: '#ffb86c',
              }}
            >
              <AlertTriangle size={28} />
            </div>

            <h3 id="skip-dialog-title" style={{ margin: '0 0 0.75rem 0', fontSize: '1.4rem', color: '#ffb86c', fontWeight: 'bold' }}>
              ยืนยันการข้ามกิจกรรม?
            </h3>

            <p style={{ margin: '0 0 1rem 0', fontSize: '1rem', lineHeight: '1.6', color: 'rgba(255, 255, 255, 0.85)' }}>
              ต้องการจบเวลากิจกรรมนี้ทันทีโดยไม่ต้องรอนักเรียนหรือไม่?
            </p>

            <div
              style={{
                background: 'rgba(0, 0, 0, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '12px 16px',
                margin: '0 0 1.5rem 0',
                fontSize: '0.92rem',
                color: '#8be9fd',
              }}
            >
              📊 ขณะนี้มีนักเรียนตอบแล้ว <strong>{answered}</strong> จาก <strong>{total}</strong> คน
              <div style={{ marginTop: '4px', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                (ระบบจะสรุปผลและคิดคะแนนเฉพาะผู้ที่ส่งคำตอบแล้วเท่านั้น)
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'background 0.2s',
                }}
              >
                ยกเลิก
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                style={{
                  flex: 1.3,
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #ffb86c 0%, #ff8c42 100%)',
                  color: '#1a1d2e',
                  fontSize: '0.95rem',
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 15px rgba(255, 140, 66, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                {loading ? 'กำลังข้าม…' : '⏭️ ยืนยันข้าม (Skip)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
