import { useState, useRef } from "react";
import { PlusCircle, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion, AnimatePresence } from "framer-motion";
// import { uploadImageToInfura } from "@/utils";
import axios from 'axios';

type Expense = {
  id: number;
  description: string;
  amount: number;
  paidBy: string;
};

type Participant = {
  id: number;
  name: string;
};

const MotionCard = motion(Card);
const MotionButton = motion(Button);

export default function Create() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newExpense, setNewExpense] = useState<Omit<Expense, "id">>({
    description: "",
    amount: 0,
    paidBy: "",
  });
  const [newParticipant, setNewParticipant] = useState("");
  const [splitType, setSplitType] = useState("manual");
  const [totalAmount, setTotalAmount] = useState(0);
  const [ipfsCid, setIpfsCid] = useState(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [ocrItems, setOcrItems] = useState<Array<{ description: string; amount: number }>>([]);
  const [ocrTotalAmount, setOcrTotalAmount] = useState<number>(0);
  const [ocrMerchantName, setOcrMerchantName] = useState<string>('');
  const [ocrDate, setOcrDate] = useState<string>('');

  const addExpense = () => {
    if (newExpense.description && newExpense.amount > 0 && newExpense.paidBy) {
      setExpenses([...expenses, { ...newExpense, id: Date.now() }]);
      setNewExpense({ description: "", amount: 0, paidBy: "" });
    } else {
      toast({
        title: "Invalid Expense",
        description: "Please fill in all expense details correctly.",
        variant: "destructive",
      });
    }
  };

  const removeExpense = (id: number) => {
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  const addParticipant = () => {
    if (newParticipant) {
      setParticipants([
        ...participants,
        { id: Date.now(), name: newParticipant },
      ]);
      setNewParticipant("");
    } else {
      toast({
        title: "Invalid Participant",
        description: "Please enter a participant name.",
        variant: "destructive",
      });
    }
  };

  const calculateSplitExpenses = () => {
    if (splitType === "even") {
      const perPersonExpense = totalAmount / participants.length;
      return participants.reduce((acc, participant) => {
        acc[participant.name] = -perPersonExpense;
        return acc;
      }, {} as Record<string, number>);
    } else {
      const totalExpense = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
      );
      const perPersonExpense = totalExpense / participants.length;
      const balances: Record<string, number> = {};

      participants.forEach((participant) => {
        balances[participant.name] = 0;
      });

      expenses.forEach((expense) => {
        balances[expense.paidBy] += expense.amount;
      });

      Object.keys(balances).forEach((person) => {
        balances[person] -= perPersonExpense;
      });

      return balances;
    }
  };

  const splitExpenses = () => {
    if (
      participants.length < 2 ||
      (splitType === "manual" && expenses.length === 0) ||
      (splitType === "even" && totalAmount === 0)
    ) {
      toast({
        title: "Cannot Split Expenses",
        description:
          "Please add at least 2 participants and expenses or total amount.",
        variant: "destructive",
      });
      return;
    }

    const balances = calculateSplitExpenses();
    const messages: string[] = [];

    Object.entries(balances).forEach(([person, balance]) => {
      if (balance > 0) {
        messages.push(`${person} is owed £${balance.toFixed(2)}`);
      } else if (balance < 0) {
        messages.push(`${person} owes £${Math.abs(balance).toFixed(2)}`);
      }
    });

    toast({
      title: "Expense Split Results",
      description: (
        <ul className="mt-2 space-y-1">
          {messages.map((msg, index) => (
            <li key={index}>{msg}</li>
          ))}
        </ul>
      ),
      duration: 5000,
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event?.target?.files) return null;
    const file = event?.target?.files[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptImage(reader.result as string);
        };
        reader.readAsDataURL(file);
  
        const formData = new FormData();
        formData.append('api_key', 'TEST'); // Replace 'TEST' with your actual API key
        formData.append('recognizer', 'auto');
        formData.append('ref_no', `ocr_react_${Date.now()}`);
        formData.append('file', file);
  
        const response = await axios.post('https://ocr.asprise.com/api/v1/receipt', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
  
        const ocrResult = response.data;
        console.log("OCR Result:", ocrResult);
  
        processOcrResult(ocrResult);
  
      } catch (error) {
        console.error("Upload failed:", error);
      }
    }
  };

  const processOcrResult = (ocrResult: any) => {
    if (ocrResult && ocrResult.receipts && ocrResult.receipts.length > 0) {
      const receipt = ocrResult.receipts[0];
      
      const items = receipt.items?.map((item: any) => ({
        description: item.description || 'Unknown Item',
        amount: parseFloat(item.amount) || 0
      })) || [];
      setOcrItems(items);
      
      const totalAmount = parseFloat(receipt.total) || 0;
      setOcrTotalAmount(totalAmount);
      setTotalAmount(totalAmount);
      setOcrMerchantName(receipt.merchant_name || 'Unknown Merchant');
      
      setOcrDate(receipt.date || 'Unknown Date');
      
      const itemsTotal = items.reduce((sum, item) => sum + item.amount, 0);
      const difference = Math.abs(totalAmount - itemsTotal);
      
      if (difference > 0.01) { // Allow for small rounding differences
        toast({
          title: "Receipt Discrepancy",
          description: `There's a difference of ${difference.toFixed(2)} between items total and receipt total.`,
          variant: "warning",
        });
      }
      
      displayOcrResults(items, totalAmount, itemsTotal);
    }
  };
  
  const displayOcrResults = (items: Array<{ description: string; amount: number }>, totalAmount: number, itemsTotal: number) => {
    toast({
      title: "Receipt Processed",
      description: (
        <div>
          <p>Merchant: {ocrMerchantName.toString()}</p>
          <p>Items: {items.length}</p>
          <p>Items Total: £{itemsTotal.toFixed(2)}</p>
          <p>Receipt Total: £{totalAmount.toFixed(2)}</p>
          <button onClick={() => showDetailedResults(items)} className="mt-2 px-2 py-1 bg-blue-500 text-white rounded">
            Show Details
          </button>
        </div>
      ),
      duration: 10000,
    });
  };
  
  const showDetailedResults = (items: Array<{ description: string; amount: number }>) => {
    toast({
      title: "Detailed Receipt Items",
      description: (
        <ul className="mt-2 space-y-1 max-h-60 overflow-y-auto">
          {items.map((item, index) => (
            <li key={index}>{item.description}: ${item.amount.toFixed(2)}</li>
          ))}
        </ul>
      ),
      duration: 15000,
    });
  };

  return (
    <motion.div
      className="space-y-8 px-4 py-4 mx-auto md:w-1/2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div
        className="relative h-40 bg-primary overflow-hidden rounded-md border border-gray-700"
        style={{
          position: "relative",
          isolation: "isolate",
        }}
      >
        <div
          style={{
            content: '""',
            position: "absolute",
            inset: 0,
            backgroundImage: 'url("/bg-2.jpg")',
            // backgroundSize: "100px",
            // backgroundRepeat: "repeat",
            opacity: 0.3,
            zIndex: -1,
          }}
        />
        <motion.div
          className="absolute inset-0 bg-gray-800"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
            opacity: [0.2, 0.3],
          }}
        />
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-6">
          <motion.h1
            className="text-4xl font-bold mb-2 text-gray-200"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            New Group
          </motion.h1>
          <motion.p
            className="text-xl text-gray-400"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Split expenses, not friendships! 💸🤝
          </motion.p>
        </div>
      </div>
      <MotionCard
        className="bg-primary text-gray-200 border border-gray-700 overflow-hidden relative shine-effect"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
      >
        <CardHeader>
          <CardTitle>Add Participants</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Input
              placeholder="Participant name"
              value={newParticipant}
              onChange={(e) => setNewParticipant(e.target.value)}
            />
            <MotionButton
              variant="outline"
              className="mt-auto text-gray-800"
              onClick={addParticipant}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Add
            </MotionButton>
          </div>
          <motion.div
            className="mt-4 flex flex-wrap gap-2"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            <AnimatePresence>
              {participants.map((participant) => (
                <motion.div
                  key={participant.id}
                  className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                >
                  {participant.name}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </CardContent>
        <style>{`
          .shine-effect {
            position: relative;
            overflow: hidden;
          }
          .shine-effect::before {
            content: "";
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: linear-gradient(
              to bottom right,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.1) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            transform: rotate(45deg);
            animation: shine 3s infinite;
          }
          @keyframes shine {
            0% {
              transform: translateX(-200%) translateY(-200%) rotate(45deg);
            }
            100% {
              transform: translateX(200%) translateY(200%) rotate(45deg);
            }
          }
        `}</style>
      </MotionCard>

      <MotionCard
        className="bg-primary text-gray-200 border border-gray-700"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <RadioGroup
            defaultValue="manual"
            onValueChange={(value) => setSplitType(value)}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem
                value="manual"
                id="manual"
                className="
              peer
              h-4
              w-4
              shrink-0
              rounded-full
              border
              border-primary
              ring-offset-background
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-ring
              focus-visible:ring-offset-2
              disabled:cursor-not-allowed
              disabled:opacity-50
              data-[state=checked]:bg-primary-foreground
              data-[state=checked]:text-primary
              dark:border-gray-400
              dark:data-[state=checked]:bg-gray-300
              dark:data-[state=checked]:border-gray-300
              transition-colors
              text-gray-200 bg-white
            "
              />
              <Label htmlFor="manual">Manual Split</Label>
            </div>
            <div className="flex items-center space-x-2 text-gray-200">
              <RadioGroupItem
                className="peer
              h-4
              w-4
              shrink-0
              rounded-full
              border
              border-primary
              ring-offset-background
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-ring
              focus-visible:ring-offset-2
              disabled:cursor-not-allowed
              disabled:opacity-50
              data-[state=checked]:bg-primary-foreground
              data-[state=checked]:text-primary
              dark:border-gray-400
              dark:data-[state=checked]:bg-gray-300
              dark:data-[state=checked]:border-gray-300
              transition-colors
              text-gray-200 bg-white"
                value="even"
                id="even"
              />
              <Label htmlFor="even">Even Split</Label>
            </div>
          </RadioGroup>

          {splitType === "even" ? (
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Total Amount</Label>
              <Input
                id="totalAmount"
                type="number"
                placeholder="Total amount"
                value={totalAmount || ""}
                onChange={(e) =>
                  setTotalAmount(parseFloat(e.target.value) || 0)
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Expense description"
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Amount"
                  value={newExpense.amount || ""}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paidBy">Paid By</Label>
                <Select
                  onValueChange={(value) =>
                    setNewExpense({ ...newExpense, paidBy: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select participant" />
                  </SelectTrigger>
                  <SelectContent>
                    {participants.map((participant) => (
                      <SelectItem key={participant.id} value={participant.name}>
                        {participant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {splitType === "manual" && (
            <MotionButton
              onClick={addExpense}
              className="w-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
            </MotionButton>
          )}

          <div className="space-y-2">
            <Label htmlFor="receiptUpload">Upload Receipt</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="receiptUpload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                ref={fileInputRef}
              />
              <MotionButton
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="text-gray-700"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Upload className="mr-2 h-4 w-4" /> Upload Image
              </MotionButton>
              {receiptImage && (
                <span className="text-sm text-muted-foreground">
                  Image uploaded
                </span>
              )}
            </div>
          </div>

          {receiptImage && (
            <div className="mt-4">
              <img
                src={receiptImage}
                alt="Receipt"
                className="max-w-full h-auto rounded-lg shadow-md"
              />
            </div>
          )}
        </CardContent>
        {splitType === "manual" && (
          <CardFooter className="flex-col items-stretch">
            <motion.div
              className="space-y-2"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.1 } },
              }}
            >
              <AnimatePresence>
                {expenses.map((expense) => (
                  <motion.div
                    key={expense.id}
                    className="flex justify-between items-center bg-primary border border-700 p-2 rounded-md"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span>
                      {expense.description} - ${expense.amount.toFixed(2)} (Paid
                      by {expense.paidBy})
                    </span>
                    <MotionButton
                      variant="ghost"
                      size="sm"
                      onClick={() => removeExpense(expense.id)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </MotionButton>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </CardFooter>
        )}
      </MotionCard>

      <MotionButton
        onClick={splitExpenses}
        className="w-full bg-gray-200 text-gray-700 hover:bg-gray-200 hover:text-gray-600"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        Split Expenses
      </MotionButton>
    </motion.div>
  );
}
