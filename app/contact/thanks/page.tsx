import Link from "next/link";
import { PublicShell } from "../../public-site";
import styles from "../../public-site.module.css";
export default function ContactThanksPage(){return <PublicShell><section className={styles.successPanel}><span className={styles.eyebrow}>Enquiry received</span><h1>Thanks for reaching out.</h1><p>Your message has been submitted. DauVinci Studio can review your project details and follow up using the email address you provided.</p><Link className={styles.buttonPrimary} href="/">Back to home ↗</Link></section></PublicShell>}