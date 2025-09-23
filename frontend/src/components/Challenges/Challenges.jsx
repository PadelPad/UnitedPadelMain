import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient.js';

const Challenges = () => {
  const [challenges, setChallenges] = useState([]);
  const [newChallenge, setNewChallenge] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('challenges').select('*');
    if (error) {
      console.error(error);
      setErrorMsg('Failed to load challenges.');
    } else {
      setChallenges(data);
      setErrorMsg('');
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newChallenge.trim()) return;

    setLoading(true);
    const { error } = await supabase
      .from('challenges')
      .insert([{ title: newChallenge, status: 'pending' }]);
    if (error) {
      console.error(error);
      setErrorMsg('Failed to add challenge.');
    } else {
      setNewChallenge('');
      fetchChallenges();
    }
    setLoading(false);
  };

  const updateChallengeStatus = async (id, newStatus) => {
    setLoading(true);
    const { error } = await supabase
      .from('challenges')
      .update({ status: newStatus })
      .eq('id', id);
    if (error) {
      console.error(error);
      setErrorMsg('Failed to update challenge.');
    } else {
      fetchChallenges();
    }
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Challenges</h2>

      <form onSubmit={handleSubmit} className="mb-6 flex">
        <input
          type="text"
          value={newChallenge}
          onChange={(e) => setNewChallenge(e.target.value)}
          placeholder="Enter challenge title"
          className="border p-2 mr-2 flex-grow"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </form>

      {errorMsg && <p className="text-red-500 mb-4">{errorMsg}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className="space-y-4">
          {challenges.length === 0 ? (
            <li>No challenges found.</li>
          ) : (
            challenges.map((challenge) => (
              <li
                key={challenge.id}
                className="border p-4 rounded shadow-md flex flex-col sm:flex-row justify-between items-center"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 w-full">
                  <span className="font-semibold">{challenge.title}</span>
                  <span className="text-sm text-gray-500 italic">
                    ({challenge.status})
                  </span>
                </div>

                <div className="flex space-x-2 mt-2 sm:mt-0">
                  {challenge.status === 'pending' && (
                    <button
                      onClick={() => updateChallengeStatus(challenge.id, 'accepted')}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Accept
                    </button>
                  )}
                  {challenge.status !== 'completed' && (
                    <button
                      onClick={() => updateChallengeStatus(challenge.id, 'completed')}
                      className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};

export default Challenges;