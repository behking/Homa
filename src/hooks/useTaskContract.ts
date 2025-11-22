import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi } from "viem";

export const CONTRACT_ADDRESS = "0x9ad09953380f5a87Ba85E8cCf12927bF9f22C15A" as `0x${string}`;

const taskTrackerAbi = parseAbi([
  "function createTask(string calldata description) external",
  "function completeTask(uint256 taskId) external",
  "function getUserTasks(address user) external view returns ((string description, bool completed, uint256 timestamp)[])",
  "function getCompletedCount(address user) external view returns (uint256)",

  "event TaskCreated(address indexed user, uint256 taskId, string description)",
  "event TaskCompleted(address indexed user, uint256 taskId)"
]);

export type Task = {
  description: string;
  completed: boolean;
  timestamp: bigint;
};

export function useTaskContract(userAddress: `0x${string}` | undefined) {
  // Read all tasks
  const { data: tasks, refetch: refetchTasks } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: taskTrackerAbi,
    functionName: "getUserTasks",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Read completed count
  const { data: completedCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: taskTrackerAbi,
    functionName: "getCompletedCount",
    args: userAddress ? [userAddress] : undefined,
    query: {
      enabled: !!userAddress,
    },
  });

  // Write functions
  const { writeContract, data: hash, isPending, error } = useWriteContract();

  // Wait for tx confirmation
  const { isSuccess, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
  });

  // Create task
  const createTask = (description: string) => {
    if (!description.trim()) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: taskTrackerAbi,
      functionName: "createTask",
      args: [description],
    });
  };

  // Complete task
  const completeTask = (taskId: number) => {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: taskTrackerAbi,
      functionName: "completeTask",
      args: [BigInt(taskId)],
    });
  };

  return {
    tasks: (tasks as Task[]) || [],
    completedCount: completedCount ? Number(completedCount) : 0,
    createTask,
    completeTask,
    isPending,
    isConfirming,
    isSuccess,
    error,
    refetchTasks,
    transactionHash: hash,
  };
}
