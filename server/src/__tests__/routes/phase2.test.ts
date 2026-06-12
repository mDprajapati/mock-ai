import request from 'supertest';
import express from 'express';
import phase2Router from '../../routes/phase2';
import * as jsExercises from '../../services/jsExercises';

jest.mock('../../services/jsExercises');
const mockPick = jsExercises.pickExercises as jest.MockedFunction<typeof jsExercises.pickExercises>;

const app = express();
app.use(express.json());
app.use('/api/phase2', phase2Router);

const sampleExercise = { title: 'FizzBuzz', description: 'desc', starterCode: '// code' };

beforeEach(() => {
  mockPick.mockReturnValue([sampleExercise, sampleExercise, sampleExercise, sampleExercise]);
});

describe('GET /api/phase2/exercises', () => {
  it('defaults to count=4 and experience="0-2"', async () => {
    const res = await request(app).get('/api/phase2/exercises');
    expect(res.status).toBe(200);
    expect(mockPick).toHaveBeenCalledWith('0-2', 4);
  });

  it('passes experience query param through', async () => {
    await request(app).get('/api/phase2/exercises?experience=5-8');
    expect(mockPick).toHaveBeenCalledWith('5-8', 4);
  });

  it('parses count query param', async () => {
    await request(app).get('/api/phase2/exercises?count=3');
    expect(mockPick).toHaveBeenCalledWith('0-2', 3);
  });

  it('clamps count to max of 5', async () => {
    await request(app).get('/api/phase2/exercises?count=10');
    expect(mockPick).toHaveBeenCalledWith('0-2', 5);
  });

  it('defaults count to 4 when count is NaN', async () => {
    await request(app).get('/api/phase2/exercises?count=abc');
    expect(mockPick).toHaveBeenCalledWith('0-2', 4);
  });

  it('returns 200 with exercises array', async () => {
    const res = await request(app).get('/api/phase2/exercises');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('exercises');
    expect(Array.isArray(res.body.exercises)).toBe(true);
  });

  it('includes exercise fields in response', async () => {
    const res = await request(app).get('/api/phase2/exercises');
    expect(res.body.exercises[0]).toHaveProperty('title');
    expect(res.body.exercises[0]).toHaveProperty('description');
    expect(res.body.exercises[0]).toHaveProperty('starterCode');
  });
});
