"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LogIn } from "lucide-react"

interface LoginFormProps {
  onLogin: (userAccess: string[]) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbxGzl1EP1Vc6C5hB4DyOpmxraeUc0Ar4mAw567VOKlaBk0qwdFxyB37cgiGNiKYXww7/exec"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // Fetch data from Google Apps Script URL
      const response = await fetch(`${GOOGLE_SCRIPT_URL}?sheet=Login`, {
        method: "GET",
      })

      if (!response.ok) {
        throw new Error("Network response was not ok")
      }

      const result = await response.json()
      console.log("Response from server:", result) // Debug log

      // Handle different response formats
      let data = result
      if (result.data) {
        data = result.data
      } else if (result.values) {
        data = result.values
      }

      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.error("Data is not an array:", data)
        setError("Invalid response format from server")
        return
      }

      // Find matching user in the fetched data
      const user = data.find((row: any[]) => row && row[0] === username && row[1] === password)

      if (user) {
        // Parse access permissions from column C
        let userAccess: string[] = []
        const accessString = user[2] ? String(user[2]).toLowerCase().trim() : ""

        if (accessString === "all") {
          // If access is "all", grant access to all pages
          userAccess = [
            "dashboard",
            "orders",
            "gate-entry",
            "first-weight",
            "load-vehicle",
            "second-weight",
            "generate-invoice",
            "gate-out",
            "payment",
            "complaint-details",
            "party-feedback"
          ]
        } else if (accessString) {
          // ✅ FIXED: Parse comma-separated values WITHOUT automatically adding dashboard
          userAccess = accessString
            .split(",")
            .map((item: string) => item.trim())
            .filter((item) => item.length > 0)
          // ✅ REMOVED: No longer automatically adding dashboard
        } else {
          // ✅ FIXED: If no access specified, give empty array (no access)
          userAccess = []
        }

        console.log("🔑 User access granted:", userAccess) // Debug log
        onLogin(userAccess)
      } else {
        setError("Invalid username or password")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("Failed to connect to authentication server. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-purple-200 shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-full">
              <LogIn className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-red-gradient">O2D</CardTitle>
          <CardDescription>Enter your credentials to access the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
                className="border-red-200 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="border-red-200 focus:border-red-500 focus:ring-red-500"
              />
            </div>
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
