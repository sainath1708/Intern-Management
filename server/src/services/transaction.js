import mongoose from 'mongoose';

const isTransactionUnsupported = (error) => {
  const message = String(error?.message || '');
  return (
    error?.code === 20 ||
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set') ||
    message.includes('Transaction API error')
  );
};

export const withTransaction = async (work) => {
  const session = await mongoose.startSession();

  try {
    if (mongoose.connection.readyState !== 1) {
      return await work(null);
    }

    let result;
    try {
      await session.withTransaction(async () => {
        result = await work(session);
      });
      return result;
    } catch (error) {
      if (!isTransactionUnsupported(error)) throw error;
      console.warn('[db] transactions unsupported by this MongoDB deployment - using compensating rollback');
      return await work(null);
    }
  } finally {
    await session.endSession();
  }
};
